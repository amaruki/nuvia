import type { NavItemData } from "./types";

export const membershipSection: readonly NavItemData[] = [
  // Membership Management Section
  {
    id: "memberships",
    title: "Memberships",
    path: "/dashboard/memberships",
    category: "main",
    roles: ["admin", "superadmin", "staff", "chapter_admin", "chapter_president"],
    subItems: [
      {
        id: "member-directory",
        title: "Directory",
        path: "/dashboard/memberships/directory",
        roles: [
          "admin",
          "superadmin",
          "staff",
          "chapter_admin",
          "chapter_president",
          "member_corporate",
          "member_professional",
          "member",
          "moderator",
        ],
      },
      {
        id: "membership-tiers",
        title: "Tiers",
        path: "/dashboard/memberships/tiers",
        roles: ["admin", "superadmin", "staff"],
      },
      {
        id: "membership-applications",
        title: "Applications",
        path: "/dashboard/memberships/applications",
        roles: ["admin", "superadmin", "staff", "chapter_admin", "chapter_president"],
        // UI-01: hardcoded "3" badge removed; no client badge-fetch infra exists,
        // so no count is shown instead of a fabricated one.
      },
      {
        id: "membership-renewals",
        title: "Renewals",
        path: "/dashboard/memberships/renewals",
        roles: ["admin", "superadmin", "staff"],
      },
      {
        // UI-22: id was "member-analytics", colliding with analytics.ts;
        // navigation-config keyed icons and group dedupe by id, so the
        // memberships copy gets its own id. Path stays stable.
        id: "membership-analytics",
        title: "Analytics",
        path: "/dashboard/memberships/analytics",
        roles: ["admin", "superadmin", "staff", "chapter_admin", "chapter_president"],
      },
    ] as const,
  },
] as const;
