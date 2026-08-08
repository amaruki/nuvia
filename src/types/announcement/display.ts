import type { AnnouncementPriority, AnnouncementTargetAudience, AnnouncementType } from "./base";

// Display information
export const ANNOUNCEMENT_TYPE_DISPLAY: Record<
  AnnouncementType,
  {
    name: string;
    description: string;
    icon: string;
    color: string;
  }
> = {
  general: {
    name: "General",
    description: "General announcements and updates",
    icon: "megaphone",
    color: "blue",
  },
  event: {
    name: "Event",
    description: "Event-related announcements",
    icon: "calendar",
    color: "green",
  },
  policy: {
    name: "Policy",
    description: "Policy changes and updates",
    icon: "shield",
    color: "red",
  },
  maintenance: {
    name: "Maintenance",
    description: "System maintenance notices",
    icon: "settings",
    color: "orange",
  },
  feature: {
    name: "Feature",
    description: "New feature announcements",
    icon: "star",
    color: "purple",
  },
  security: {
    name: "Security",
    description: "Security-related announcements",
    icon: "lock",
    color: "red",
  },
  reminder: {
    name: "Reminder",
    description: "Important reminders",
    icon: "bell",
    color: "amber",
  },
  celebration: {
    name: "Celebration",
    description: "Celebrations and achievements",
    icon: "gift",
    color: "pink",
  },
  emergency: {
    name: "Emergency",
    description: "Emergency announcements",
    icon: "alert-triangle",
    color: "red",
  },
  banner: {
    name: "Banner",
    description: "Banner announcements displayed at bottom of page",
    icon: "layout",
    color: "purple",
  },
};

export const ANNOUNCEMENT_PRIORITY_DISPLAY: Record<
  AnnouncementPriority,
  {
    name: string;
    description: string;
    icon: string;
    color: string;
    badgeVariant: "default" | "secondary" | "destructive" | "outline";
  }
> = {
  low: {
    name: "Low",
    description: "Low priority announcement",
    icon: "arrow-down",
    color: "slate",
    badgeVariant: "secondary",
  },
  medium: {
    name: "Medium",
    description: "Medium priority announcement",
    icon: "minus",
    color: "blue",
    badgeVariant: "outline",
  },
  high: {
    name: "High",
    description: "High priority announcement",
    icon: "arrow-up",
    color: "amber",
    badgeVariant: "outline",
  },
  urgent: {
    name: "Urgent",
    description: "Urgent announcement",
    icon: "alert-triangle",
    color: "red",
    badgeVariant: "destructive",
  },
};

export const ANNOUNCEMENT_TARGET_AUDIENCE_DISPLAY: Record<
  AnnouncementTargetAudience,
  {
    name: string;
    description: string;
    icon: string;
    color: string;
  }
> = {
  all_members: {
    name: "All Members",
    description: "All community members",
    icon: "users",
    color: "blue",
  },
  specific_chapters: {
    name: "Specific Chapters",
    description: "Selected chapters only",
    icon: "building",
    color: "green",
  },
  specific_committees: {
    name: "Specific Committees",
    description: "Selected committees only",
    icon: "users-2",
    color: "purple",
  },
  premium_members: {
    name: "Premium Members",
    description: "Premium members only",
    icon: "crown",
    color: "amber",
  },
  chapter_admins: {
    name: "Chapter Admins",
    description: "Chapter administrators only",
    icon: "shield-check",
    color: "indigo",
  },
  committee_chairs: {
    name: "Committee Chairs",
    description: "Committee chairs only",
    icon: "award",
    color: "emerald",
  },
  staff_only: {
    name: "Staff Only",
    description: "Staff members only",
    icon: "user-check",
    color: "red",
  },
  public: {
    name: "Public",
    description: "Publicly visible to everyone",
    icon: "globe",
    color: "cyan",
  },
};
