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
        title: "Member Directory",
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
        title: "Membership Tiers",
        path: "/dashboard/memberships/tiers",
        roles: ["admin", "superadmin", "staff"],
      },
      {
        id: "membership-applications",
        title: "Applications",
        path: "/dashboard/memberships/applications",
        roles: ["admin", "superadmin", "staff", "chapter_admin", "chapter_president"],
        badge: "3",
      },
      {
        id: "membership-renewals",
        title: "Renewals",
        path: "/dashboard/memberships/renewals",
        roles: ["admin", "superadmin", "staff"],
      },
      {
        id: "member-analytics",
        title: "Member Analytics",
        path: "/dashboard/memberships/analytics",
        roles: ["admin", "superadmin", "staff", "chapter_admin", "chapter_president"],
      },
    ] as const,
  },
] as const;
