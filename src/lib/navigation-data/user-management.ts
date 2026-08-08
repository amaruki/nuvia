import type { NavItemData } from "./types";

export const userManagementSection: readonly NavItemData[] = [
  // User Management Section
  {
    id: "user-management",
    title: "User Management",
    path: "/dashboard/users",
    category: "admin",
    roles: ["admin", "superadmin", "staff"],
    subItems: [
      {
        id: "user-directory",
        title: "User Directory",
        path: "/dashboard/users/directory",
        roles: ["admin", "superadmin", "staff"],
      },
      {
        id: "user-roles",
        title: "User Roles & Permissions",
        path: "/dashboard/users/roles",
        roles: ["admin", "superadmin"],
      },
      {
        id: "user-security",
        title: "Security & Access",
        path: "/dashboard/users/security",
        roles: ["admin", "superadmin"],
      },
    ] as const,
  },
] as const;
