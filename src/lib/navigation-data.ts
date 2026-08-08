/**
 * Pure data behind the dashboard sidebar (navigation-config.tsx composes
 * icons onto this) and behind src/lib/dashboard-access.ts's server-side
 * route authorization. Kept icon-free and framework-free on purpose: this
 * file is imported from src/proxy.ts (Node middleware, runs on every
 * request), and a JSX/lucide-react import there would drag React and ~45
 * icon components into that bundle for no reason.
 */

import type { UserRole } from "@/types/dashboard.types";

export interface NavItemData {
  readonly id: string;
  readonly title: string;
  readonly path: string;
  readonly badge?: string | null;
  readonly roles?: UserRole[];
  readonly category?: "main" | "personal" | "admin" | "system";
  readonly subItems?: readonly NavItemData[];
}

export const navigationData: readonly NavItemData[] = [
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

  // User Management Section
  {
    id: "user-management",
    title: "User Management",
    path: "/dashboard/users",
    category: "admin",
    roles: ["admin", "superadmin", "staff"],
    subItems: [
      {
        id: "user-directory",
        title: "User Directory",
        path: "/dashboard/users/directory",
        roles: ["admin", "superadmin", "staff"],
      },
      {
        id: "user-roles",
        title: "User Roles & Permissions",
        path: "/dashboard/users/roles",
        roles: ["admin", "superadmin"],
      },
      {
        id: "user-security",
        title: "Security & Access",
        path: "/dashboard/users/security",
        roles: ["admin", "superadmin"],
      },
    ] as const,
  },

  // Membership Management Section
  {
    id: "memberships",
    title: "Memberships",
    path: "/dashboard/memberships",
    category: "main",
    roles: ["admin", "superadmin", "staff", "chapter_admin", "chapter_president"],
    subItems: [
      {
        id: "member-directory",
        title: "Member Directory",
        path: "/dashboard/memberships/directory",
        roles: [
          "admin",
          "superadmin",
          "staff",
          "chapter_admin",
          "chapter_president",
          "member_corporate",
          "member_professional",
          "member",
          "moderator",
        ],
      },
      {
        id: "membership-tiers",
        title: "Membership Tiers",
        path: "/dashboard/memberships/tiers",
        roles: ["admin", "superadmin", "staff"],
      },
      {
        id: "membership-applications",
        title: "Applications",
        path: "/dashboard/memberships/applications",
        roles: ["admin", "superadmin", "staff", "chapter_admin", "chapter_president"],
        badge: "3",
      },
      {
        id: "membership-renewals",
        title: "Renewals",
        path: "/dashboard/memberships/renewals",
        roles: ["admin", "superadmin", "staff"],
      },
      {
        id: "member-analytics",
        title: "Member Analytics",
        path: "/dashboard/memberships/analytics",
        roles: ["admin", "superadmin", "staff", "chapter_admin", "chapter_president"],
      },
    ] as const,
  },

  // Event Management Section
  {
    id: "events",
    title: "Events",
    path: "/dashboard/events",
    category: "main",
    badge: "2",
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

  // Financial Management Section
  {
    id: "finance",
    title: "Finance",
    path: "/dashboard/finance",
    category: "main",
    roles: ["admin", "superadmin", "treasurer", "staff"],
    subItems: [
      {
        id: "budget-management",
        title: "Budget Management",
        path: "/dashboard/finance/budget",
        roles: ["admin", "superadmin", "treasurer", "chapter_president", "committee_chair"],
      },
      {
        id: "dues-management",
        title: "Member Dues",
        path: "/dashboard/finance/dues",
        roles: ["admin", "superadmin", "treasurer", "staff"],
      },
      {
        id: "invoices-billing",
        title: "Invoices & Billing",
        path: "/dashboard/finance/invoices",
        roles: ["admin", "superadmin", "treasurer", "staff"],
      },
      {
        id: "donations-grants",
        title: "Donations & Grants",
        path: "/dashboard/finance/donations",
        roles: ["admin", "superadmin", "treasurer", "staff"],
      },
      {
        id: "financial-reports",
        title: "Financial Reports",
        path: "/dashboard/finance/reports",
        roles: ["admin", "superadmin", "treasurer"],
      },
      {
        id: "payment-gateways",
        title: "Payment Gateways",
        path: "/dashboard/finance/gateways",
        roles: ["admin", "superadmin", "treasurer"],
      },
    ] as const,
  },

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

  // Content Management Section
  {
    id: "content",
    title: "Content Management",
    path: "/dashboard/content",
    category: "main",
    roles: ["admin", "superadmin", "staff", "moderator"],
    subItems: [
      {
        id: "publications",
        title: "Publications",
        path: "/dashboard/content/publications",
        roles: ["admin", "superadmin", "staff"],
      },
      {
        id: "articles-news",
        title: "Articles & News",
        path: "/dashboard/content/articles",
        roles: ["admin", "superadmin", "staff", "moderator"],
      },
      {
        id: "announcements",
        title: "Announcements",
        path: "/dashboard/content/announcements",
        roles: ["admin", "superadmin", "staff", "chapter_admin", "committee_chair"],
      },
      {
        id: "categories-tags",
        title: "Categories & Tags",
        path: "/dashboard/content/categories",
        roles: ["admin", "superadmin", "staff"],
      },
      {
        id: "media-library",
        title: "Media Library",
        path: "/dashboard/content/media",
        roles: ["admin", "superadmin", "staff"],
      },
    ] as const,
  },

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

  // Forums & Discussions Section
  {
    id: "forums",
    title: "Forums & Discussions",
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
    ],
    subItems: [
      {
        id: "forum-categories",
        title: "Forum Categories",
        path: "/dashboard/forums/categories",
        roles: ["admin", "superadmin", "staff", "moderator"],
      },
      {
        id: "forum-moderation",
        title: "Content Moderation",
        path: "/dashboard/forums/moderation",
        roles: ["admin", "superadmin", "staff", "moderator"],
      },
      {
        id: "user-reports",
        title: "User Reports",
        path: "/dashboard/forums/reports",
        roles: ["admin", "superadmin", "staff", "moderator"],
      },
    ] as const,
  },

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

  // Communications Section
  {
    id: "communications",
    title: "Communications",
    path: "/dashboard/communications",
    category: "main",
    roles: ["admin", "superadmin", "staff", "moderator", "chapter_admin", "committee_chair"],
    subItems: [
      {
        id: "newsletters",
        title: "Newsletters",
        path: "/dashboard/communications/newsletters",
        roles: ["admin", "superadmin", "staff"],
      },
      {
        id: "notification-system",
        title: "Notification System",
        path: "/dashboard/communications/notifications",
        roles: ["admin", "superadmin", "staff"],
        badge: "5",
      },
      {
        id: "announcement-management",
        title: "Announcement Management",
        path: "/dashboard/communications/announcements",
        roles: ["admin", "superadmin", "staff", "chapter_admin", "committee_chair"],
      },
      {
        id: "calendar-integration",
        title: "Calendar Integration",
        path: "/dashboard/communications/calendar",
        roles: ["admin", "superadmin", "staff"],
      },
    ] as const,
  },

  // Analytics & Reports Section
  {
    id: "analytics",
    title: "Analytics & Reports",
    path: "/dashboard/analytics",
    category: "main",
    roles: ["admin", "superadmin", "staff", "treasurer", "chapter_admin", "chapter_president"],
    subItems: [
      {
        id: "member-analytics",
        title: "Member Analytics",
        path: "/dashboard/analytics/members",
        roles: ["admin", "superadmin", "staff", "chapter_admin", "chapter_president"],
      },
      {
        id: "event-analytics",
        title: "Event Analytics",
        path: "/dashboard/analytics/events",
        roles: ["admin", "superadmin", "staff", "organizer", "chapter_admin"],
      },
      {
        id: "financial-analytics",
        title: "Financial Analytics",
        path: "/dashboard/analytics/financial",
        roles: ["admin", "superadmin", "treasurer"],
      },
      {
        id: "content-analytics",
        title: "Content Analytics",
        path: "/dashboard/analytics/content",
        roles: ["admin", "superadmin", "staff", "moderator"],
      },
      {
        id: "custom-reports",
        title: "Custom Reports",
        path: "/dashboard/analytics/custom",
        roles: ["admin", "superadmin", "staff", "treasurer"],
      },
    ] as const,
  },

  // System Settings & Administration
  {
    id: "system-settings",
    title: "System Settings",
    path: "/dashboard/settings/system",
    category: "admin",
    roles: ["admin", "superadmin"],
    subItems: [
      {
        id: "general-settings",
        title: "General Settings",
        path: "/dashboard/settings/general",
        roles: ["admin", "superadmin"],
      },
      {
        id: "security-settings",
        title: "Security Configuration",
        path: "/dashboard/settings/security",
        roles: ["admin", "superadmin"],
      },
      {
        id: "oauth-settings",
        title: "OAuth Configuration",
        path: "/dashboard/settings/oauth",
        roles: ["admin", "superadmin"],
      },
      {
        id: "payment-settings",
        title: "Payment Gateway Settings",
        path: "/dashboard/settings/payments",
        roles: ["admin", "treasurer", "superadmin"],
      },
      {
        id: "email-settings",
        title: "Email Configuration",
        path: "/dashboard/settings/email",
        roles: ["admin", "superadmin"],
      },
    ] as const,
  },
  {
    id: "system-tools",
    title: "System Tools",
    path: "/dashboard/tools",
    category: "admin",
    roles: ["admin", "superadmin"],
    subItems: [
      {
        id: "database-tools",
        title: "Database Tools",
        path: "/dashboard/tools/database",
        roles: ["admin", "superadmin"],
      },
      {
        id: "cache-management",
        title: "Cache Management",
        path: "/dashboard/tools/cache",
        roles: ["admin", "superadmin"],
      },
      {
        id: "system-logs",
        title: "System Logs",
        path: "/dashboard/tools/logs",
        roles: ["admin", "superadmin"],
      },
      {
        id: "backup-restore",
        title: "Backup & Restore",
        path: "/dashboard/tools/backup",
        roles: ["admin", "superadmin"],
      },
    ] as const,
  },

  // Personal Settings Section
  {
    id: "personal-settings",
    title: "Personal Settings",
    path: "/dashboard/profile",
    category: "personal",
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
    subItems: [
      {
        id: "profile",
        title: "Profile",
        path: "/dashboard/profile",
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
        id: "preferences",
        title: "Preferences",
        path: "/dashboard/preferences",
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
    ] as const,
  },
] as const;

export const navigationCategories = {
  main: "Main Navigation",
  personal: "Personal Settings",
  admin: "Administration",
} as const;
