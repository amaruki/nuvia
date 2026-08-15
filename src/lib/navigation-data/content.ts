import type { NavItemData } from "./types";

export const contentSection: readonly NavItemData[] = [
  // Content Management Section
  {
    id: "content",
    title: "Content",
    path: "/dashboard/content",
    category: "main",
    roles: ["admin", "superadmin", "staff", "moderator", "demo"],
    subItems: [
      {
        id: "publications",
        title: "Publications",
        path: "/dashboard/content/publications",
        roles: ["admin", "superadmin", "staff"],
      },
      {
        id: "articles-news",
        title: "Articles",
        path: "/dashboard/content/articles",
        roles: ["admin", "superadmin", "staff", "moderator", "demo"],
      },
      {
        id: "announcements",
        title: "Announcements",
        path: "/dashboard/content/announcements",
        roles: ["admin", "superadmin", "staff", "chapter_admin", "committee_chair", "demo"],
      },
      {
        id: "categories-tags",
        title: "Categories",
        path: "/dashboard/content/categories",
        roles: ["admin", "superadmin", "staff"],
      },
      {
        id: "media-library",
        title: "Media",
        path: "/dashboard/content/media",
        roles: ["admin", "superadmin", "staff"],
      },
    ] as const,
  },
] as const;
