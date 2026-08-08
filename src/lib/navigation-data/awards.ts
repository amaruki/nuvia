import type { NavItemData } from "./types";

export const awardsSection: readonly NavItemData[] = [
  // Awards & Recognition Section
  {
    id: "awards",
    title: "Awards & Recognition",
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
    ],
    subItems: [
      {
        id: "award-programs",
        title: "Award Programs",
        path: "/dashboard/awards/programs",
        roles: ["admin", "superadmin", "staff", "committee_chair"],
      },
      {
        id: "award-nominations",
        title: "Nominations",
        path: "/dashboard/awards/nominations",
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
    ] as const,
  },
] as const;
