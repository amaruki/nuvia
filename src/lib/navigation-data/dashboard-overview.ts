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
  // Member home hub (UI-31): own membership, registrations, applications,
  // forum activity, announcements. Visible to every signed-in role.
  {
    id: "my-home",
    title: "My Home",
    path: "/dashboard/my",
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
