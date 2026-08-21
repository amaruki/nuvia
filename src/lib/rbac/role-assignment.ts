/**
 * Role assignment and mutation.
 *
 * The pure assignment rules (canAssignRole, canGrantPermissions) plus the
 * single role-mutation gate every role change funnels through
 * (checkRoleAssignable -> changeUserRole), and the last-superadmin lockout
 * guard.
 */

import { count, eq, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { authLog, user } from "@/db/schema";
import { logger } from "@/lib/logger";
import { invalidateUserSessionCaches } from "@/lib/session-cache";
import {
  PredefinedRole,
  Permission,
  ROLE_PERMISSIONS,
  Role,
  canManageRole,
  getRoleLevel,
  isPredefinedRole,
} from "@/types/role";
import { getUserPermissions } from "./role-queries";

const SUPERADMIN_INVARIANT_LOCK = "nuvia:superadmin-invariant";

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
    const result = await db.transaction(async (tx) => {
      // Serialize every role mutation with account deletion. The count and
      // mutation must share this lock or two concurrent demotions can both
      // observe two superadmins and remove the final two accounts.
      await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${SUPERADMIN_INVARIANT_LOCK}))`);

      const [targetUser] = await tx
        .select({ role: user.role })
        .from(user)
        .where(eq(user.id, targetUserId))
        .for("update")
        .limit(1);
      if (!targetUser) return { success: false, error: "USER_NOT_FOUND", changed: false };

      const [assigner] = await tx
        .select({ role: user.role })
        .from(user)
        .where(eq(user.id, changedBy))
        .limit(1);
      if (
        !assigner ||
        changedBy === targetUserId ||
        !canManageRole(assigner.role as Role, targetUser.role as Role)
      ) {
        return { success: false, error: "INSUFFICIENT_PERMISSIONS", changed: false };
      }

      if (targetUser.role === newRole) return { success: true, changed: false };

      let newRolePermissions: Permission[];
      if (isPredefinedRole(newRole)) {
        newRolePermissions = ROLE_PERMISSIONS[newRole];
      } else {
        const customRoleRecord = await tx.query.customRole.findFirst({
          where: (table, { eq: eqOp }) => eqOp(table.name, newRole),
          columns: { permissions: true, isActive: true },
        });
        if (!customRoleRecord?.isActive) {
          return { success: false, error: "INVALID_ROLE", changed: false };
        }
        newRolePermissions = customRoleRecord.permissions as Permission[];
      }

      let assignerPermissions: Permission[];
      if (isPredefinedRole(assigner.role as Role)) {
        assignerPermissions = ROLE_PERMISSIONS[assigner.role as PredefinedRole];
      } else {
        const assignerRoleRecord = await tx.query.customRole.findFirst({
          where: (table, { eq: eqOp }) => eqOp(table.name, assigner.role),
          columns: { permissions: true, isActive: true },
        });
        assignerPermissions = assignerRoleRecord?.isActive
          ? (assignerRoleRecord.permissions as Permission[])
          : [];
      }

      if (!canAssignRole(assigner.role as Role, assignerPermissions, newRole, newRolePermissions)) {
        return { success: false, error: "ROLE_NOT_ASSIGNABLE", changed: false };
      }

      if (targetUser.role === "superadmin") {
        const [superadminCount] = await tx
          .select({ value: count() })
          .from(user)
          .where(eq(user.role, "superadmin"));
        if (superadminCount.value <= 1) {
          return { success: false, error: "LAST_SUPERADMIN", changed: false };
        }
      }

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

      return { success: true, changed: true };
    });

    if (!result.success || !result.changed) return result;

    // Drop the target's cached sessions (ENABLE_REDIS_CACHE deployments)
    // so a demotion takes effect immediately instead of after the 60s
    // cache TTL. Best effort: cache misses fall through to the database.
    try {
      await invalidateUserSessionCaches(targetUserId);
    } catch (cacheError) {
      logger.warn("Failed to invalidate session cache after role change", cacheError);
    }

    return { success: true };
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

/**
 * Run a destructive account operation while holding the same invariant lock
 * as role changes. The operation can use another database connection. The
 * transaction-scoped advisory lock remains held until the operation returns.
 */
export async function runUnlessLastSuperadmin<T>(
  userId: string,
  operation: () => Promise<T>,
): Promise<{ allowed: false } | { allowed: true; value: T }> {
  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${SUPERADMIN_INVARIANT_LOCK}))`);

    const [targetUser] = await tx
      .select({ role: user.role })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (targetUser?.role === "superadmin") {
      const [superadminCount] = await tx
        .select({ value: count() })
        .from(user)
        .where(eq(user.role, "superadmin"));
      if (superadminCount.value <= 1) return { allowed: false } as const;
    }

    return { allowed: true, value: await operation() } as const;
  });
}
