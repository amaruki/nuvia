import type { NavItemData } from "./types";

export const awardsSection: readonly NavItemData[] = [
  // Awards & Recognition Section
  {
    id: "awards",
    title: "Awards",
    path: "/dashboard/awards",
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
      "demo",
    ],
    subItems: [
      {
        id: "award-programs",
        title: "Programs",
        path: "/dashboard/awards/programs",
        roles: ["admin", "superadmin", "staff", "committee_chair"],
      },
      {
        // Admin review queue — gating fix (backlog UI-36): members used to
        // see this child, but the page behind it requires awards:read and
        // bounced them. Members get the nomination surface below instead.
        id: "award-nominations",
        title: "Nominations",
        path: "/dashboard/awards/nominations",
        roles: ["admin", "superadmin", "staff", "committee_chair"],
      },
      {
        id: "award-nominate",
        title: "Nominate",
        path: "/dashboard/awards/nominate",
        roles: [
          "user",
          "member",
          "member_student",
          "member_professional",
          "member_corporate",
          "admin",
          "superadmin",
          "staff",
          "demo",
        ],
      },
    ] as const,
  },
] as const;
