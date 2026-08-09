import type { NavItemData } from "./types";

export const learningSection: readonly NavItemData[] = [
  // Learning & Development Section
  {
    id: "learning",
    title: "Learning & Development",
    path: "/dashboard/learning",
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
        id: "courses",
        title: "Courses",
        path: "/dashboard/learning/courses",
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
      {
        // Member enrollment surface (backlog UI-35): my courses with real
        // progress, lesson view, enroll/unenroll.
        id: "my-courses",
        title: "My Courses",
        path: "/dashboard/learning/my-courses",
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
      {
        id: "certifications",
        title: "Certifications",
        path: "/dashboard/learning/certifications",
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
      {
        id: "course-management",
        title: "Course Management",
        path: "/dashboard/learning/admin",
        roles: ["admin", "superadmin", "staff"],
      },
      {
        id: "certificate-management",
        title: "Certificate Management",
        path: "/dashboard/learning/certificate-management",
        roles: ["admin", "superadmin", "staff"],
      },
      {
        id: "instructor-settings",
        title: "Instructor Settings",
        path: "/dashboard/learning/settings",
        roles: ["admin", "superadmin", "staff", "organizer"],
      },
    ] as const,
  },
] as const;
