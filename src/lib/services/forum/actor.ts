import type { ForumCategory } from "@/db/schema";
import { problems } from "@/lib/http";
import { isPredefinedRole } from "@/types/dashboard.types";
import { getRoleLevel, type Permission, type Role } from "@/types/role.types";
import { ForumServiceError } from "./errors";

// ---------------------------------------------------------------------------
// Actor
// ---------------------------------------------------------------------------

/** What the service needs about the acting user (routes pass auth.user). */
export interface ForumActor {
  id: string;
  role: string;
  permissions?: readonly Permission[];
}

/**
 * The per-category role gate. forum_categories.required_role holds the
 * minimum role name; actors below that level may not post or comment in
 * the category. Comparison uses the same ROLE_HIERARCHY levels that
 * rbac.ts's hasRole() uses, so superadmin (100) always passes and custom
 * roles (level 0) never pass a non-null gate. Unknown stored role names
 * fail closed for everyone but superadmin.
 */
export function enforceCategoryRoleGate(
  category: Pick<ForumCategory, "id" | "requiredRole">,
  actor: ForumActor,
): void {
  const required = category.requiredRole;
  if (!required) return;

  const actorLevel = getRoleLevel(actor.role as Role);
  const requiredLevel = isPredefinedRole(required) ? getRoleLevel(required) : Infinity;

  if (actorLevel >= requiredLevel) return;

  throw new ForumServiceError(
    problems.insufficientPermission(`Category requires role ${required} or higher to post`),
  );
}
