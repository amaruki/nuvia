import type { NavItemData } from "./types";

export const dashboardOverviewSection: readonly NavItemData[] = [
  // Dashboard Overview
  {
    id: "dashboard",
    title: "Dashboard",
    path: "/dashboard",
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
  },
] as const;
