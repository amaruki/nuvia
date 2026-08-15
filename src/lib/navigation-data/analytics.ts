import type { NavItemData } from "./types";

export const analyticsSection: readonly NavItemData[] = [
  // Analytics & Reports Section
  {
    id: "analytics",
    title: "Analytics",
    path: "/dashboard/analytics",
    category: "main",
    roles: ["admin", "superadmin", "staff", "treasurer", "chapter_admin", "chapter_president"],
    subItems: [
      {
        id: "member-analytics",
        title: "Members",
        path: "/dashboard/analytics/members",
        roles: ["admin", "superadmin", "staff", "chapter_admin", "chapter_president"],
      },
      {
        id: "event-analytics",
        title: "Events",
        path: "/dashboard/analytics/events",
        roles: ["admin", "superadmin", "staff", "organizer", "chapter_admin"],
      },
      {
        id: "financial-analytics",
        title: "Finance",
        path: "/dashboard/analytics/financial",
        roles: ["admin", "superadmin", "treasurer"],
      },
      {
        id: "content-analytics",
        title: "Content",
        path: "/dashboard/analytics/content",
        roles: ["admin", "superadmin", "staff", "moderator"],
      },
      {
        id: "custom-reports",
        title: "Reports",
        path: "/dashboard/analytics/custom",
        roles: ["admin", "superadmin", "staff", "treasurer"],
      },
    ] as const,
  },
] as const;
