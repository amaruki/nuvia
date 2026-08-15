import type { NavItemData } from "./types";

export const systemAdminSections: readonly NavItemData[] = [
  // System Settings & Administration
  {
    id: "system-settings",
    title: "Settings",
    path: "/dashboard/settings/system",
    category: "admin",
    roles: ["admin", "superadmin"],
    subItems: [
      {
        id: "general-settings",
        title: "General",
        path: "/dashboard/settings/general",
        roles: ["admin", "superadmin"],
      },
      {
        id: "security-settings",
        title: "Security",
        path: "/dashboard/settings/security",
        roles: ["admin", "superadmin"],
      },
      {
        id: "oauth-settings",
        title: "OAuth",
        path: "/dashboard/settings/oauth",
        roles: ["admin", "superadmin"],
      },
      {
        id: "payment-settings",
        title: "Payments",
        path: "/dashboard/settings/payments",
        roles: ["admin", "treasurer", "superadmin"],
      },
      {
        id: "email-settings",
        title: "Email",
        path: "/dashboard/settings/email",
        roles: ["admin", "superadmin"],
      },
    ] as const,
  },
  {
    id: "system-tools",
    title: "Tools",
    path: "/dashboard/tools",
    category: "admin",
    roles: ["admin", "superadmin"],
    subItems: [
      {
        id: "database-tools",
        title: "Database",
        path: "/dashboard/tools/database",
        roles: ["admin", "superadmin"],
      },
      {
        id: "cache-management",
        title: "Cache",
        path: "/dashboard/tools/cache",
        roles: ["admin", "superadmin"],
      },
      {
        id: "system-logs",
        title: "Logs",
        path: "/dashboard/tools/logs",
        roles: ["admin", "superadmin"],
      },
      {
        id: "backup-restore",
        title: "Backups",
        path: "/dashboard/tools/backup",
        roles: ["admin", "superadmin"],
      },
    ] as const,
  },
] as const;
