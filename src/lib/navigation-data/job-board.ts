import type { NavItemData } from "./types";

export const jobBoardSection: readonly NavItemData[] = [
  // Job Board Section
  {
    id: "job-board",
    title: "Job Board",
    path: "/dashboard/jobs",
    category: "main",
    roles: [
      "user",
      "member",
      "member_student",
      "member_professional",
      "member_corporate",
      "admin",
      "superadmin",
      "staff",
    ],
  },
] as const;
