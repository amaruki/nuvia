/**
 * Role assignment and mutation.
 *
 * The pure assignment rules (canAssignRole, canGrantPermissions) plus the
 * single role-mutation gate every role change funnels through
 * (checkRoleAssignable -> changeUserRole), and the last-superadmin lockout
 * guard.
 */

import { count, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { authLog, user } from "@/db/schema";
import { logger } from "@/lib/logger";
import { invalidateUserSessionCaches } from "@/lib/session-cache";
import {
  PredefinedRole,
  Permission,
  ROLE_PERMISSIONS,
  Role,
  getRoleLevel,
  isPredefinedRole,
} from "@/types/role";
import { canManageUserRole } from "./role-checks";
import { getUserPermissions } from "./role-queries";

/**
 * Pure role-assignment rule. Answers one question: given the assigner's
 * role and effective permissions, may they grant `newRole` to someone?
 *
 * - Only a superadmin may grant superadmin.
 * - A superadmin may grant anything else.
 * - Predefined roles follow ROLE_HIERARCHY: the assigner must strictly
 *   outrank the granted role (an admin cannot mint another admin).
 * - Custom roles have no hierarchy position. They are grantable only when
 *   the assigner personally holds every permission the role carries — a
 *   role's permissions can never exceed its grantor's.
 *
 * Callers must resolve `newRolePermissions` first and reject unknown role
 * names before reaching this function (see checkRoleAssignable).
 */
export function canAssignRole(
  assignerRole: Role,
  assignerPermissions: Permission[],
  newRole: Role,
  newRolePermissions: Permission[],
): boolean {
  if (newRole === "superadmin") {
    return assignerRole === "superadmin";
  }

  if (assignerRole === "superadmin") {
    return true;
  }

  if (isPredefinedRole(newRole)) {
    return getRoleLevel(assignerRole) > getRoleLevel(newRole);
  }

  return newRolePermissions.every((permission) => assignerPermissions.includes(permission));
}

/**
 * Pure permission-grant rule for custom-role creation: a role may only be
 * created carrying permissions its creator already holds. Superadmin is
 * exempt because it holds every permission by definition.
 */
export function canGrantPermissions(
  creatorRole: Role,
  creatorPermissions: Permission[],
  requestedPermissions: Permission[],
): boolean {
  if (creatorRole === "superadmin") {
    return true;
  }

  return requestedPermissions.every((permission) => creatorPermissions.includes(permission));
}

export type RoleAssignmentErrorCode = "INVALID_ROLE" | "ROLE_NOT_ASSIGNABLE";

/**
 * Resolve a role name and check it against the assigner's own role and
 * permissions. This is the single gate every role grant must pass —
 * role changes, admin-created users, and bulk updates all route through
 * changeUserRole, which calls this.
 *
 * INVALID_ROLE: the name is neither a predefined role nor an *active*
 * custom role. Granting a dead name would leave the user with a role
 * string that resolves to zero permissions — or worse, silently start
 * granting permissions if a custom role with that name is created later.
 */
export async function checkRoleAssignable(
  assignerId: string,
  newRole: Role,
): Promise<{ valid: true } | { valid: false; error: RoleAssignmentErrorCode }> {
  let newRolePermissions: Permission[];

  if (isPredefinedRole(newRole)) {
    newRolePermissions = ROLE_PERMISSIONS[newRole as PredefinedRole];
  } else {
    const customRoleRecord = await db.query.customRole.findFirst({
      where: (customRoleTable, { eq: eqOp }) => eqOp(customRoleTable.name, newRole),
      columns: { permissions: true, isActive: true },
    });

    if (!customRoleRecord || !customRoleRecord.isActive) {
      return { valid: false, error: "INVALID_ROLE" };
    }

    newRolePermissions = customRoleRecord.permissions as Permission[];
  }

  const assigner = await getUserPermissions(assignerId);

  if (!canAssignRole(assigner.role, assigner.permissions, newRole, newRolePermissions)) {
    return { valid: false, error: "ROLE_NOT_ASSIGNABLE" };
  }

  return { valid: true };
}

/**
 * Change user role with validation and audit logging
 */
export async function changeUserRole(
  targetUserId: string,
  newRole: Role,
  changedBy: string,
  reason?: string,
  metadata?: {
    ipAddress?: string;
    userAgent?: string;
  },
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    // Validate that the changer can manage the target user's role
    const canManage = await canManageUserRole(changedBy, targetUserId);

    if (!canManage) {
      return {
        success: false,
        error: "INSUFFICIENT_PERMISSIONS",
      };
    }

    // Get current role for audit
    const targetUser = await db.query.user.findFirst({
      where: eq(user.id, targetUserId),
      columns: { role: true },
    });

    if (!targetUser) {
      return {
        success: false,
        error: "USER_NOT_FOUND",
      };
    }

    // If role is the same, no change needed
    if (targetUser.role === newRole) {
      return {
        success: true,
      };
    }

    // The assigner must also outrank the *new* role — not just the
    // target's current one. Before this check existed, an admin could
    // promote anyone to superadmin: canManageUserRole only compared the
    // assigner against the target's current role.
    const assignable = await checkRoleAssignable(changedBy, newRole);

    if (!assignable.valid) {
      return {
        success: false,
        error: assignable.error,
      };
    }

    // Lockout guard: never demote the only superadmin. On today's paths
    // this check cannot fire — only a superadmin can demote a superadmin,
    // so two exist while the change runs — but changeUserRole is the
    // single role-mutation gate, and any future caller (self-service
    // demotion, a system process) gets the protection for free.
    if (targetUser.role === "superadmin") {
      const [superadminCount] = await db
        .select({ value: count() })
        .from(user)
        .where(eq(user.role, "superadmin"));

      if (superadminCount.value <= 1) {
        return {
          success: false,
          error: "LAST_SUPERADMIN",
        };
      }
    }

    // Update the role and write the audit entry in one transaction — the
    // original Prisma version ran these as two separate, un-transacted
    // statements, so a failure between them could silently drop the audit
    // trail. See docs/adr/0009-security-hardening-p0.md.
    await db.transaction(async (tx) => {
      await tx.update(user).set({ role: newRole }).where(eq(user.id, targetUserId));

      await tx.insert(authLog).values({
        userId: targetUserId,
        eventType: "ROLE_CHANGE",
        severity: "INFO",
        message: `Role changed from ${targetUser.role} to ${newRole}`,
        ipAddress: metadata?.ipAddress,
        userAgent: metadata?.userAgent,
        metadata: {
          previousRole: targetUser.role,
          newRole,
          changedBy,
          reason,
        },
      });
    });

    // Drop the target's cached sessions (ENABLE_REDIS_CACHE deployments)
    // so a demotion takes effect immediately instead of after the 60s
    // cache TTL. Best effort: cache misses fall through to the database.
    try {
      await invalidateUserSessionCaches(targetUserId);
    } catch (cacheError) {
      logger.warn("Failed to invalidate session cache after role change", cacheError);
    }

    return {
      success: true,
    };
  } catch (error) {
    logger.error("Error changing user role", error);
    return {
      success: false,
      error: "INTERNAL_ERROR",
    };
  }
}

/**
 * True when the user is a superadmin and the only one left. Used as a
 * lockout guard before destructive self-service operations (account
 * deletion): losing the last superadmin locks a deployment out of its
 * own user management permanently, because only a superadmin can grant
 * the superadmin role.
 */
export async function isLastSuperadmin(userId: string): Promise<boolean> {
  const targetUser = await db.query.user.findFirst({
    where: eq(user.id, userId),
    columns: { role: true },
  });

  if (targetUser?.role !== "superadmin") {
    return false;
  }

  const [superadminCount] = await db
    .select({ value: count() })
    .from(user)
    .where(eq(user.role, "superadmin"));

  return superadminCount.value <= 1;
}
