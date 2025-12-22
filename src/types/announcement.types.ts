// Announcement types for Nuvia community platform
// Extends article types with announcement-specific fields

import {
  Article,
  ArticleFilters,
  ArticleFormData,
  ArticleStatus,
  ArticleCategory,
  ArticleType,
  ArticleFormat,
  ArticleDifficulty,
  ArticleAuthor,
  ArticleTag,
  ArticleSEO
} from "./article.types";

// Announcement-specific types
export type AnnouncementPriority = 'low' | 'medium' | 'high' | 'urgent';

export type AnnouncementTargetAudience =
  | 'all_members'
  | 'specific_chapters'
  | 'specific_committees'
  | 'premium_members'
  | 'chapter_admins'
  | 'committee_chairs'
  | 'staff_only'
  | 'public';

export type AnnouncementType =
  | 'general'
  | 'event'
  | 'policy'
  | 'maintenance'
  | 'feature'
  | 'security'
  | 'reminder'
  | 'celebration'
  | 'emergency'
  | 'banner';

// Announcement interface - we'll create a new interface instead of extending to avoid conflicts
export interface Announcement {
  // Base article fields
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  status: ArticleStatus;
  author: ArticleAuthor;
  coAuthors?: ArticleAuthor[];
  reviewer?: ArticleAuthor;
  tags: ArticleTag[];
  featuredImage?: string;
  gallery?: string[];
  attachments?: {
    id: string;
    name: string;
    url: string;
    size: number;
    type: string;
  }[];
  publishedAt?: Date;
  scheduledFor?: Date;
  lastModified: Date;
  reviewedAt?: Date;
  readTime: number;
  wordCount: number;
  estimatedReadingSpeed?: number;
  seo: ArticleSEO;
  series?: any; // Not typically used for announcements
  visibility: 'public' | 'members_only' | 'premium_only' | 'chapter_only' | 'committee_only';
  allowedRoles?: string[];
  allowedChapters?: string[];
  allowedCommittees?: string[];
  version: number;
  language: string;
  parentArticleId?: string;
  commentsEnabled: boolean;
  sharingEnabled: boolean;
  downloadEnabled: boolean;
  isFeatured: boolean;
  
  // Announcement-specific fields (replacing article-specific ones)
  type: AnnouncementType;
  category: 'announcements'; // Always announcements
  priority: AnnouncementPriority;
  targetAudience: AnnouncementTargetAudience;
  targetChapters?: string[]; // Chapter IDs if targetAudience is 'specific_chapters'
  targetCommittees?: string[]; // Committee IDs if targetAudience is 'specific_committees'
  expiresAt?: Date; // When announcement expires
  isPinned: boolean; // Pin to top
  isUrgent: boolean; // Urgent flag
  requiresAcknowledgment: boolean; // Whether users must acknowledge
  acknowledgmentCount?: number; // Number of acknowledgments
  sendEmailNotification: boolean; // Whether to send email
  sendPushNotification: boolean; // Whether to send push notification
  displayOnHomepage: boolean; // Whether to display on homepage
  displayInDashboard: boolean; // Whether to display in dashboard
}

// Announcement statistics
export interface AnnouncementStatistics {
  // Basic announcement statistics
  totalAnnouncements: number;
  announcementsByType: {
    type: AnnouncementType;
    count: number;
  }[];
  
  announcementsByPriority: {
    priority: AnnouncementPriority;
    count: number;
  }[];
  
  announcementsByTargetAudience: {
    targetAudience: AnnouncementTargetAudience;
    count: number;
  }[];
  
  // Announcement-specific metrics
  totalAcknowledgments: number;
  averageAcknowledgmentRate: number;
  urgentAnnouncements: number;
  pinnedAnnouncements: number;
  expiredAnnouncements: number;
  activeAnnouncements: number;
}

// Announcement filters extending ArticleFilters
export interface AnnouncementFilters extends Omit<
  ArticleFilters, 
  'type' | 'category' | 'difficulty' | 'format'
> {
  // Override with announcement-specific filters
  type?: AnnouncementType[];
  category?: ['announcements']; // Always announcements
  difficulty?: never; // Not applicable
  format?: never; // Not applicable
  
  // Announcement-specific filters
  priority?: AnnouncementPriority[];
  targetAudience?: AnnouncementTargetAudience[];
  targetChapters?: string[];
  targetCommittees?: string[];
  expiresAt?: {
    start?: Date;
    end?: Date;
  };
  isPinned?: boolean;
  isUrgent?: boolean;
  requiresAcknowledgment?: boolean;
  hasExpiration?: boolean;
  sendEmailNotification?: boolean;
  sendPushNotification?: boolean;
  displayOnHomepage?: boolean;
  displayInDashboard?: boolean;
  minAcknowledgmentRate?: number;
  maxAcknowledgmentRate?: number;
}

// Form values type for react-hook-form
export interface AnnouncementFormValues {
  title: string;
  excerpt: string;
  content: string;
  type: AnnouncementType;
  priority: AnnouncementPriority;
  targetAudience: AnnouncementTargetAudience;
  status: ArticleStatus;
  authorId: string;
  tagIds: string[];
  featuredImage?: string;
  expiresAt?: Date;
  isPinned: boolean;
  isUrgent: boolean;
  requiresAcknowledgment: boolean;
  sendEmailNotification: boolean;
  sendPushNotification: boolean;
  displayOnHomepage: boolean;
  displayInDashboard: boolean;
  visibility: 'public' | 'members_only' | 'premium_only' | 'chapter_only' | 'committee_only';
  allowedRoles: string[];
  allowedChapters: string[];
  allowedCommittees: string[];
  commentsEnabled: boolean;
  sharingEnabled: boolean;
  downloadEnabled: boolean;
  isFeatured: boolean;
}

// Attachment type for form
export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
}

// Announcement form data - creating new interface to avoid conflicts
export interface AnnouncementFormData {
  // Base article fields
  title: string;
  slug?: string;
  excerpt: string;
  content: string;
  status: ArticleStatus;
  authorId: string;
  coAuthorIds?: string[];
  reviewerId?: string;
  tagIds: string[];
  seriesId?: string;
  featuredImage?: string;
  gallery?: string[];
  attachments?: File[];
  
  // Publishing
  publishedAt?: Date;
  scheduledFor?: Date;
  
  // SEO - optional for announcements
  seo?: {
    title: string;
    description: string;
    keywords: string[];
    ogImage?: string;
    canonicalUrl?: string;
  };
  
  // Access control
  visibility: 'public' | 'members_only' | 'premium_only' | 'chapter_only' | 'committee_only';
  allowedRoles?: string[];
  allowedChapters?: string[];
  allowedCommittees?: string[];
  
  // Interaction settings
  commentsEnabled: boolean;
  sharingEnabled: boolean;
  downloadEnabled: boolean;
  
  // Featured
  isFeatured: boolean;
  
  // Announcement-specific fields (replacing article-specific ones)
  type: AnnouncementType;
  category: 'announcements'; // Always announcements
  priority: AnnouncementPriority;
  targetAudience: AnnouncementTargetAudience;
  targetChapters?: string[];
  targetCommittees?: string[];
  expiresAt?: Date;
  isPinned: boolean;
  isUrgent: boolean;
  requiresAcknowledgment: boolean;
  sendEmailNotification: boolean;
  sendPushNotification: boolean;
  displayOnHomepage: boolean;
  displayInDashboard: boolean;
}

// Export type constants for re-use
export const ANNOUNCEMENT_TYPES: AnnouncementType[] = [
  'general', 'event', 'policy', 'maintenance', 'feature',
  'security', 'reminder', 'celebration', 'emergency', 'banner'
] as const;

export const ANNOUNCEMENT_PRIORITIES: AnnouncementPriority[] = [
  'low', 'medium', 'high', 'urgent'
] as const;

export const ANNOUNCEMENT_TARGET_AUDIENCES: AnnouncementTargetAudience[] = [
  'all_members', 'specific_chapters', 'specific_committees', 'premium_members',
  'chapter_admins', 'committee_chairs', 'staff_only', 'public'
] as const;

// Display information
export const ANNOUNCEMENT_TYPE_DISPLAY: Record<AnnouncementType, {
  name: string;
  description: string;
  icon: string;
  color: string;
}> = {
  general: {
    name: 'General',
    description: 'General announcements and updates',
    icon: 'megaphone',
    color: 'blue'
  },
  event: {
    name: 'Event',
    description: 'Event-related announcements',
    icon: 'calendar',
    color: 'green'
  },
  policy: {
    name: 'Policy',
    description: 'Policy changes and updates',
    icon: 'shield',
    color: 'red'
  },
  maintenance: {
    name: 'Maintenance',
    description: 'System maintenance notices',
    icon: 'settings',
    color: 'orange'
  },
  feature: {
    name: 'Feature',
    description: 'New feature announcements',
    icon: 'star',
    color: 'purple'
  },
  security: {
    name: 'Security',
    description: 'Security-related announcements',
    icon: 'lock',
    color: 'red'
  },
  reminder: {
    name: 'Reminder',
    description: 'Important reminders',
    icon: 'bell',
    color: 'amber'
  },
  celebration: {
    name: 'Celebration',
    description: 'Celebrations and achievements',
    icon: 'gift',
    color: 'pink'
  },
  emergency: {
    name: 'Emergency',
    description: 'Emergency announcements',
    icon: 'alert-triangle',
    color: 'red'
  },
  banner: {
    name: 'Banner',
    description: 'Banner announcements displayed at bottom of page',
    icon: 'layout',
    color: 'purple'
  }
};

export const ANNOUNCEMENT_PRIORITY_DISPLAY: Record<AnnouncementPriority, {
  name: string;
  description: string;
  icon: string;
  color: string;
  badgeVariant: 'default' | 'secondary' | 'destructive' | 'outline';
}> = {
  low: {
    name: 'Low',
    description: 'Low priority announcement',
    icon: 'arrow-down',
    color: 'slate',
    badgeVariant: 'secondary'
  },
  medium: {
    name: 'Medium',
    description: 'Medium priority announcement',
    icon: 'minus',
    color: 'blue',
    badgeVariant: 'outline'
  },
  high: {
    name: 'High',
    description: 'High priority announcement',
    icon: 'arrow-up',
    color: 'amber',
    badgeVariant: 'outline'
  },
  urgent: {
    name: 'Urgent',
    description: 'Urgent announcement',
    icon: 'alert-triangle',
    color: 'red',
    badgeVariant: 'destructive'
  }
};

export const ANNOUNCEMENT_TARGET_AUDIENCE_DISPLAY: Record<AnnouncementTargetAudience, {
  name: string;
  description: string;
  icon: string;
  color: string;
}> = {
  all_members: {
    name: 'All Members',
    description: 'All community members',
    icon: 'users',
    color: 'blue'
  },
  specific_chapters: {
    name: 'Specific Chapters',
    description: 'Selected chapters only',
    icon: 'building',
    color: 'green'
  },
  specific_committees: {
    name: 'Specific Committees',
    description: 'Selected committees only',
    icon: 'users-2',
    color: 'purple'
  },
  premium_members: {
    name: 'Premium Members',
    description: 'Premium members only',
    icon: 'crown',
    color: 'amber'
  },
  chapter_admins: {
    name: 'Chapter Admins',
    description: 'Chapter administrators only',
    icon: 'shield-check',
    color: 'indigo'
  },
  committee_chairs: {
    name: 'Committee Chairs',
    description: 'Committee chairs only',
    icon: 'award',
    color: 'emerald'
  },
  staff_only: {
    name: 'Staff Only',
    description: 'Staff members only',
    icon: 'user-check',
    color: 'red'
  },
  public: {
    name: 'Public',
    description: 'Publicly visible to everyone',
    icon: 'globe',
    color: 'cyan'
  }
};