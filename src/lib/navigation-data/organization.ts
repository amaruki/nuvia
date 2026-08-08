import type { NavItemData } from "./types";

export const organizationSection: readonly NavItemData[] = [
  // Organization Structure Section
  {
    id: "organization",
    title: "Organization",
    path: "/dashboard/organization",
    category: "main",
    roles: ["admin", "superadmin", "chapter_president", "chapter_admin", "committee_chair"],
    subItems: [
      {
        id: "chapters",
        title: "Chapters",
        path: "/dashboard/organization/chapters",
        roles: ["admin", "superadmin", "chapter_president", "chapter_admin"],
      },
      {
        id: "committees",
        title: "Committees",
        path: "/dashboard/organization/committees",
        roles: ["admin", "superadmin", "chapter_president", "committee_chair"],
      },
      {
        id: "committee-workspaces",
        title: "Committee Workspaces",
        path: "/dashboard/organization/workspaces",
        roles: ["admin", "superadmin", "committee_chair", "member", "member_professional"],
      },
      {
        id: "committee-budgets",
        title: "Committee Budgets",
        path: "/dashboard/organization/budget",
        roles: ["admin", "superadmin", "treasurer", "committee_chair"],
      },
    ] as const,
  },
] as const;
