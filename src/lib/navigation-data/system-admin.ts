import type { NavItemData } from "./types";

export const systemAdminSections: readonly NavItemData[] = [
  // System Settings & Administration
  {
    id: "system-settings",
    title: "System Settings",
    path: "/dashboard/settings/system",
    category: "admin",
    roles: ["admin", "superadmin"],
    subItems: [
      {
        id: "general-settings",
        title: "General Settings",
        path: "/dashboard/settings/general",
        roles: ["admin", "superadmin"],
      },
      {
        id: "security-settings",
        title: "Security Configuration",
        path: "/dashboard/settings/security",
        roles: ["admin", "superadmin"],
      },
      {
        id: "oauth-settings",
        title: "OAuth Configuration",
        path: "/dashboard/settings/oauth",
        roles: ["admin", "superadmin"],
      },
      {
        id: "payment-settings",
        title: "Payment Gateway Settings",
        path: "/dashboard/settings/payments",
        roles: ["admin", "treasurer", "superadmin"],
      },
      {
        id: "email-settings",
        title: "Email Configuration",
        path: "/dashboard/settings/email",
        roles: ["admin", "superadmin"],
      },
    ] as const,
  },
  {
    id: "system-tools",
    title: "System Tools",
    path: "/dashboard/tools",
    category: "admin",
    roles: ["admin", "superadmin"],
    subItems: [
      {
        id: "database-tools",
        title: "Database Tools",
        path: "/dashboard/tools/database",
        roles: ["admin", "superadmin"],
      },
      {
        id: "cache-management",
        title: "Cache Management",
        path: "/dashboard/tools/cache",
        roles: ["admin", "superadmin"],
      },
      {
        id: "system-logs",
        title: "System Logs",
        path: "/dashboard/tools/logs",
        roles: ["admin", "superadmin"],
      },
      {
        id: "backup-restore",
        title: "Backup & Restore",
        path: "/dashboard/tools/backup",
        roles: ["admin", "superadmin"],
      },
    ] as const,
  },
] as const;
