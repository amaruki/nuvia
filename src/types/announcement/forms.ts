import type { ArticleStatus } from "@/types/article";

import type { AnnouncementPriority, AnnouncementTargetAudience, AnnouncementType } from "./base";

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
  visibility: "public" | "members_only" | "premium_only" | "chapter_only" | "committee_only";
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

// We create a new interface instead of extending ArticleFormData to avoid conflicts
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
  attachments?: { id: string; name: string; url: string; size: number; type: string }[];

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
  visibility: "public" | "members_only" | "premium_only" | "chapter_only" | "committee_only";
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
  category: "announcements"; // Always announcements
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
