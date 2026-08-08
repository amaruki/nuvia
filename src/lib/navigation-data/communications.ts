import type { NavItemData } from "./types";

export const communicationsSection: readonly NavItemData[] = [
  // Communications Section
  {
    id: "communications",
    title: "Communications",
    path: "/dashboard/communications",
    category: "main",
    roles: ["admin", "superadmin", "staff", "moderator", "chapter_admin", "committee_chair"],
    subItems: [
      {
        id: "newsletters",
        title: "Newsletters",
        path: "/dashboard/communications/newsletters",
        roles: ["admin", "superadmin", "staff"],
      },
      {
        id: "notification-system",
        title: "Notification System",
        path: "/dashboard/communications/notifications",
        roles: ["admin", "superadmin", "staff"],
        badge: "5",
      },
      {
        id: "announcement-management",
        title: "Announcement Management",
        path: "/dashboard/communications/announcements",
        roles: ["admin", "superadmin", "staff", "chapter_admin", "committee_chair"],
      },
      {
        id: "calendar-integration",
        title: "Calendar Integration",
        path: "/dashboard/communications/calendar",
        roles: ["admin", "superadmin", "staff"],
      },
    ] as const,
  },
] as const;
