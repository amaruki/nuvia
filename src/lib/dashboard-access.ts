/**
 * Server-side counterpart to navigation-data.ts's per-item `roles` field.
 * That field already expresses which roles a dashboard section is meant
 * for, but until now it only controlled whether the sidebar showed a link
 * — nothing stopped a member from typing the URL directly (see TODO.md
 * M1's "Authorize by role, not just by login"). This module reads the
 * exact same nav data so route enforcement can never drift from what the
 * sidebar already claims about who a page is for.
 */

import { navigationData, type NavItemData } from "@/lib/navigation-data";
import type { UserRole } from "@/types/dashboard.types";

interface PathRoles {
  path: string;
  roles: readonly UserRole[];
}

function flatten(items: readonly NavItemData[], acc: PathRoles[] = []): PathRoles[] {
  for (const item of items) {
    if (item.roles) {
      acc.push({ path: item.path, roles: item.roles });
    }
    if (item.subItems) {
      flatten(item.subItems, acc);
    }
  }
  return acc;
}

// Longest path first, so a lookup finds the most specific section a given
// URL falls under (e.g. "/dashboard/users/roles" over "/dashboard/users").
const pathRoles: PathRoles[] = flatten(navigationData).sort(
  (a, b) => b.path.length - a.path.length,
);

/**
 * The roles navigation-data.ts says a dashboard URL is for, or null if no
 * nav entry covers it (treated as open to any authenticated user).
 */
export function getRequiredRolesForPath(pathname: string): readonly UserRole[] | null {
  const match = pathRoles.find(
    (entry) => pathname === entry.path || pathname.startsWith(`${entry.path}/`),
  );
  return match?.roles ?? null;
}

export function isRoleAllowedForPath(pathname: string, role: string | null | undefined): boolean {
  // superadmin holds every permission elsewhere in the system (rbac.ts's
  // hasPermission/hasRole both special-case it), so the path gate must not
  // lock it out just because a nav entry's role list forgot to name it.
  // Without this, every navigation-data.ts entry that omits "superadmin"
  // — the majority of sections and sub-items at the time of writing,
  // including the whole finance section — silently redirected the one
  // role that must be able to reach everything.
  if (role === "superadmin") {
    return true;
  }

  const requiredRoles = getRequiredRolesForPath(pathname);
  if (!requiredRoles) return true;
  return !!role && requiredRoles.includes(role as UserRole);
}
