import type { NavItemData } from "./types";

export const forumSection: readonly NavItemData[] = [
  // Forums & Discussions Section
  {
    id: "forums",
    title: "Forums & Discussions",
    path: "/dashboard/forums",
    category: "main",
    roles: [
      "user",
      "member",
      "member_student",
      "member_professional",
      "member_corporate",
      "moderator",
      "organizer",
      "committee_chair",
      "chapter_admin",
      "chapter_president",
      "staff",
      "treasurer",
      "admin",
      "superadmin",
    ],
    subItems: [
      {
        id: "forum-categories",
        title: "Forum Categories",
        path: "/dashboard/forums/categories",
        roles: ["admin", "superadmin", "staff", "moderator"],
      },
      {
        id: "forum-moderation",
        title: "Content Moderation",
        path: "/dashboard/forums/moderation",
        roles: ["admin", "superadmin", "staff", "moderator"],
      },
      {
        id: "user-reports",
        title: "User Reports",
        path: "/dashboard/forums/reports",
        roles: ["admin", "superadmin", "staff", "moderator"],
      },
    ] as const,
  },
] as const;
