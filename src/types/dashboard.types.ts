// Dashboard types for Nuvia community platform

// Primary User Roles for Association Management System
export type UserRole =
  | 'superadmin'           // Global system control
  | 'admin'                // Organization-wide management
  | 'staff'                // Operational staff
  | 'treasurer'            // Financial oversight
  | 'chapter_president'    // Chapter leadership
  | 'chapter_admin'        // Chapter administration
  | 'committee_chair'      // Committee leadership
  | 'organizer'            // Event organization
  | 'member_corporate'     // Corporate member tier
  | 'member_professional'  // Professional member tier
  | 'member_student'       // Student member tier
  | 'member'               // Basic member tier
  | 'moderator'            // Content moderation
  | 'user';                // Basic registered user

// Committee-specific roles (context-dependent)
export type CommitteeRole =
  | 'chair'        // Committee leadership
  | 'vice_chair'   // Deputy leadership
  | 'member'       // Regular participation
  | 'observer'     // Read-only access
  | 'liaison';     // Cross-committee coordinator

export type WidgetType = 
  | 'user-profile'
  | 'notifications'
  | 'upcoming-events'
  | 'recent-articles'
  | 'certificates'
  | 'community-activity'
  | 'personal-recommendations'
  | 'member-statistics'
  | 'event-activity'
  | 'recent-content'
  | 'moderation'
  | 'finance'
  | 'analytics'
  | 'global-search'
  | 'quick-navigation'
  | 'community-highlights';

export interface WidgetConfig {
  id: string;
  type: WidgetType;
  title: string;
  description?: string;
  size: 'small' | 'medium' | 'large' | 'wide';
  visible: boolean;
  order: number;
  roles: UserRole[];
}

export interface DashboardConfig {
  userId: string;
  role: UserRole;
  widgets: WidgetConfig[];
  layout: 'grid' | 'list';
  viewMode: 'compact' | 'detailed';
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  displayName?: string;
  profilePhoto?: string;
  membershipTier: 'basic' | 'premium' | 'vip';
  membershipStatus: 'active' | 'expired' | 'pending';
  joinDate: Date;
}

export interface Notification {
  id: string;
  type: 'announcement' | 'comment-reply' | 'mention' | 'event-reminder';
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
  type: 'forum-post' | 'discussion' | 'event';
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
  type: 'comment' | 'forum-thread';
  content: string;
  reportedBy: string;
  reportReason: string;
  createdAt: Date;
  status: 'pending' | 'reviewed' | 'resolved';
}