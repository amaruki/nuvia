// Dashboard types for Nuvia community platform

// Primary User Roles for Association Management System
export type UserRole =
  | "superadmin" // Global system control
  | "admin" // Organization-wide management
  | "staff" // Operational staff
  | "treasurer" // Financial oversight
  | "chapter_president" // Chapter leadership
  | "chapter_admin" // Chapter administration
  | "committee_chair" // Committee leadership
  | "organizer" // Event organization
  | "member_corporate" // Corporate member tier
  | "member_professional" // Professional member tier
  | "member_student" // Student member tier
  | "member" // Basic member tier
  | "moderator" // Content moderation
  | "user"; // Basic registered user

// Export role constants for re-use
export const USER_ROLES = [
  "superadmin",
  "admin",
  "staff",
  "treasurer",
  "chapter_president",
  "chapter_admin",
  "committee_chair",
  "organizer",
  "member_corporate",
  "member_professional",
  "member_student",
  "member",
  "moderator",
  "user",
] as const;

// Utility function to check if role is predefined
export function isPredefinedRole(role: string): role is UserRole {
  return USER_ROLES.includes(role as UserRole);
}

// Role display information
export const ROLE_DISPLAY_INFO: Record<
  UserRole,
  {
    name: string;
    description: string;
    color: string;
    icon: string;
    category: "administrative" | "leadership" | "staff" | "membership" | "basic";
  }
> = {
  superadmin: {
    name: "Super Administrator",
    description: "Complete system control and all permissions",
    color: "red",
    icon: "shield",
    category: "administrative",
  },
  admin: {
    name: "Administrator",
    description: "Organization-wide management access",
    color: "orange",
    icon: "settings",
    category: "administrative",
  },
  staff: {
    name: "Staff Member",
    description: "Operational staff with day-to-day management access",
    color: "blue",
    icon: "users",
    category: "staff",
  },
  treasurer: {
    name: "Treasurer",
    description: "Financial oversight and payment management",
    color: "green",
    icon: "dollar-sign",
    category: "leadership",
  },
  chapter_president: {
    name: "Chapter President",
    description: "Chapter leadership and management",
    color: "purple",
    icon: "crown",
    category: "leadership",
  },
  chapter_admin: {
    name: "Chapter Administrator",
    description: "Chapter-level administrative access",
    color: "purple",
    icon: "building",
    category: "leadership",
  },
  committee_chair: {
    name: "Committee Chair",
    description: "Committee leadership and coordination",
    color: "indigo",
    icon: "award",
    category: "leadership",
  },
  organizer: {
    name: "Event Organizer",
    description: "Event creation and management",
    color: "pink",
    icon: "calendar",
    category: "staff",
  },
  member_corporate: {
    name: "Corporate Member",
    description: "Corporate member with enhanced privileges",
    color: "slate",
    icon: "briefcase",
    category: "membership",
  },
  member_professional: {
    name: "Professional Member",
    description: "Professional member with standard privileges",
    color: "cyan",
    icon: "user-check",
    category: "membership",
  },
  member_student: {
    name: "Student Member",
    description: "Student member with educational privileges",
    color: "amber",
    icon: "graduation-cap",
    category: "membership",
  },
  member: {
    name: "Member",
    description: "Basic member privileges",
    color: "gray",
    icon: "user",
    category: "membership",
  },
  moderator: {
    name: "Moderator",
    description: "Content moderation and community management",
    color: "yellow",
    icon: "shield-check",
    category: "staff",
  },
  user: {
    name: "User",
    description: "Basic registered user access",
    color: "zinc",
    icon: "user",
    category: "basic",
  },
};

// Committee-specific roles (context-dependent)
export type CommitteeRole =
  | "chair" // Committee leadership
  | "vice_chair" // Deputy leadership
  | "member" // Regular participation
  | "observer" // Read-only access
  | "liaison"; // Cross-committee coordinator

export type WidgetType =
  | "user-profile"
  | "notifications"
  | "upcoming-events"
  | "recent-articles"
  | "certificates"
  | "community-activity"
  | "personal-recommendations"
  | "member-statistics"
  | "event-activity"
  | "recent-content"
  | "moderation"
  | "finance"
  | "analytics"
  | "global-search"
  | "quick-navigation"
  | "community-highlights";

export interface WidgetConfig {
  id: string;
  type: WidgetType;
  title: string;
  description?: string;
  size: "small" | "medium" | "large" | "wide";
  visible: boolean;
  order: number;
  roles: UserRole[];
}

export interface DashboardConfig {
  userId: string;
  role: UserRole;
  widgets: WidgetConfig[];
  layout: "grid" | "list";
  viewMode: "compact" | "detailed";
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  profilePhoto?: string;
  membershipTier: "basic" | "premium" | "vip" | "student" | "corporate" | "professional";
  membershipStatus: "active" | "expired" | "pending" | "suspended" | "cancelled";
  joinDate: Date;
}

export interface Notification {
  id: string;
  type: "announcement" | "comment-reply" | "mention" | "event-reminder";
  title: string;
  message: string;
  createdAt: Date;
  read: boolean;
  actionUrl?: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  location: string;
  isRegistered: boolean;
  isCheckedIn: boolean;
  qrCode?: string;
}

export interface Article {
  id: string;
  title: string;
  excerpt: string;
  author: string;
  publishedAt: Date;
  category: string;
  coverImage?: string;
  readTime?: number;
  isBookmarked?: boolean;
  commentCount?: number;
  viewCount?: number;
}

export interface Certificate {
  id: string;
  eventName: string;
  issuedDate: Date;
  downloadUrl: string;
}

export interface CommunityActivity {
  id: string;
  type: "forum-post" | "discussion" | "event";
  title: string;
  author: string;
  createdAt: Date;
  engagement: {
    likes: number;
    comments: number;
    shares: number;
  };
}

export interface MemberStatistics {
  totalMembers: number;
  activeMembers: number;
  newMembersThisMonth: number;
  /** Signups in the previous calendar month — optional, used for a real trend line. */
  newMembersLastMonth?: number;
  expiredMemberships: number;
}

export interface EventActivity {
  totalEvents: number;
  upcomingEvents: number;
  registrationsThisMonth: number;
  checkInsToday: number;
}

export interface ModerationItem {
  id: string;
  type: "comment" | "forum-thread";
  content: string;
  reportedBy: string;
  reportReason: string;
  createdAt: Date;
  status: "pending" | "reviewed" | "resolved";
}
