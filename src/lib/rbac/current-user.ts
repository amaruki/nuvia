/**
 * Current-user resolution.
 *
 * Bridges the better-auth session to the RBAC model: resolves the signed-in
 * user together with their effective permissions, from the predefined-role
 * tables or an active custom-role lookup.
 */

import { headers } from "next/headers";
import { db } from "@/db/client";
import { auth } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { PredefinedRole, Permission, ROLE_PERMISSIONS, isPredefinedRole } from "@/types/role";
import type { UserWithRole } from "./types";

/**
 * Get current user session with role and permissions.
 *
 * `headersOverride` lets a caller pass request headers explicitly instead
 * of relying on next/headers's ambient headers() — needed outside a live
 * Next.js request lifecycle (e.g. bun:test calling this directly).
 */
export async function getCurrentUser(headersOverride?: Headers): Promise<UserWithRole | null> {
  try {
    const session = await auth.api.getSession({
      headers: headersOverride ?? (await headers()),
    });

    if (!session?.user) {
      return null;
    }

    // better-auth types session.user from its base User shape only; our
    // Drizzle schema adds username/role/displayName columns that ride along
    // in the session payload, so cast to the actual shape (users.username
    // is NOT NULL; role falls back to "user" below).
    const sessionUser = session.user as unknown as {
      id: string;
      email: string;
      username: string;
      name?: string;
      displayName?: string;
      role?: string;
    };

    // Get user role from database (in case it's not in session)
    let role = sessionUser.role || "user";

    // Get permissions for the user's role
    let permissions: Permission[] = [];

    if (isPredefinedRole(role)) {
      permissions = ROLE_PERMISSIONS[role as PredefinedRole];
    } else {
      // Not one of the 14 predefined roles — user.role holds a custom
      // role's name instead (custom_roles.name, unique).
      const customRoleRecord = await db.query.customRole.findFirst({
        where: (customRoleTable, { eq: eqOp }) => eqOp(customRoleTable.name, role),
        columns: { permissions: true, isActive: true },
      });

      permissions = customRoleRecord?.isActive
        ? (customRoleRecord.permissions as Permission[])
        : [];
    }

    return {
      id: sessionUser.id,
      email: sessionUser.email,
      username: sessionUser.username,
      name: sessionUser.name,
      displayName: sessionUser.displayName,
      role,
      permissions,
    };
  } catch (error) {
    logger.error("Error getting current user", error);
    return null;
  }
}
