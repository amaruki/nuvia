import type { NavItemData } from "./types";

export const userManagementSection: readonly NavItemData[] = [
  // User Management Section
  {
    id: "user-management",
    title: "Users",
    path: "/dashboard/users",
    category: "admin",
    roles: ["admin", "superadmin", "staff"],
    subItems: [
      {
        id: "user-directory",
        title: "Directory",
        path: "/dashboard/users/directory",
        roles: ["admin", "superadmin", "staff"],
      },
      {
        id: "user-roles",
        title: "Roles",
        path: "/dashboard/users/roles",
        roles: ["admin", "superadmin"],
      },
      {
        id: "user-security",
        title: "Security",
        path: "/dashboard/users/security",
        roles: ["admin", "superadmin"],
      },
    ] as const,
  },
] as const;
