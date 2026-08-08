import type {
  ArticleAuthor,
  ArticleMetrics,
  ArticleSEO,
  ArticleSeries,
  ArticleStatus,
  ArticleTag,
} from "@/types/article";
import type { AnnouncementPriority, AnnouncementTargetAudience, AnnouncementType } from "./base";

// We create a new interface instead of extending Article to avoid conflicts
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
  metrics: ArticleMetrics;
  series?: ArticleSeries; // Not typically used for announcements
  visibility: "public" | "members_only" | "premium_only" | "chapter_only" | "committee_only";
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
  category: "announcements"; // Always announcements
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
