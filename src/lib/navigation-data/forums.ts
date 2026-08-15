import type { NavItemData } from "./types";

export const forumSection: readonly NavItemData[] = [
  // Forums & Discussions Section
  {
    id: "forums",
    title: "Forums",
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
      "demo",
    ],
    subItems: [
      {
        // Member-facing reading/participation surface (UI-27). Every role
        // that sees the parent gets this entry; the admin entries below
        // keep pointing at the moderation queue. The (public)/forums pages
        // enforce their own audience gate server-side.
        id: "forum-community",
        title: "Community",
        path: "/forums",
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
          "demo",
        ],
      },
      {
        id: "forum-categories",
        title: "Categories",
        path: "/dashboard/forums/categories",
        roles: ["admin", "superadmin", "staff", "moderator"],
      },
      {
        id: "forum-moderation",
        title: "Moderation",
        path: "/dashboard/forums/moderation",
        roles: ["admin", "superadmin", "staff", "moderator"],
      },
      {
        id: "user-reports",
        title: "Reports",
        path: "/dashboard/forums/reports",
        roles: ["admin", "superadmin", "staff", "moderator"],
      },
    ] as const,
  },
] as const;
