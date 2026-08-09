import type { NavItemData } from "./types";

export const eventSection: readonly NavItemData[] = [
  // Event Management Section
  {
    id: "events",
    title: "Events",
    path: "/dashboard/events",
    category: "main",
    // UI-01: hardcoded "2" badge removed; there is no client badge-fetch infra,
    // so the sidebar shows no count instead of a fabricated one.
    roles: [
      "admin",
      "superadmin",
      "staff",
      "organizer",
      "committee_chair",
      "chapter_admin",
      "chapter_president",
    ],
    subItems: [
      {
        id: "event-calendar",
        title: "Event Calendar",
        path: "/dashboard/events/calendar",
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
      {
        id: "event-registrations",
        title: "Registrations",
        path: "/dashboard/events/registrations",
        roles: ["admin", "superadmin", "staff", "organizer", "committee_chair"],
      },
      {
        id: "event-checkin",
        title: "QR Check-in",
        path: "/dashboard/events/checkin",
        roles: ["admin", "superadmin", "staff", "organizer", "chapter_admin"],
      },
      {
        id: "event-certificates",
        title: "Certificates",
        path: "/dashboard/events/certificates",
        roles: ["admin", "superadmin", "staff", "organizer"],
      },
      {
        id: "event-pricing",
        title: "Pricing & Promos",
        path: "/dashboard/events/pricing",
        roles: ["admin", "superadmin", "staff", "organizer"],
      },
    ] as const,
  },
] as const;
