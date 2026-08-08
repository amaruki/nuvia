import type {
  PublicationAuthor,
  PublicationMetrics,
  PublicationSEO,
  PublicationTag,
} from "./entities";
import type { PublicationCategory, PublicationStatus, PublicationType } from "./base";

export interface Publication {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  type: PublicationType;
  category: PublicationCategory;
  status: PublicationStatus;
  author: PublicationAuthor;
  coAuthors?: PublicationAuthor[];
  tags: PublicationTag[];
  featuredImage?: string;
  gallery?: string[];
  attachments?: {
    id: string;
    name: string;
    url: string;
    size: number;
    type: string;
  }[];

  // Publishing details
  publishedAt?: Date;
  scheduledFor?: Date;
  lastModified: Date;
  reviewedBy?: string;
  reviewedAt?: Date;

  // Content details
  readTime: number; // in minutes
  wordCount: number;
  difficulty: "beginner" | "intermediate" | "advanced";

  // SEO and metadata
  seo: PublicationSEO;

  // Metrics and analytics
  metrics: PublicationMetrics;

  // Access control
  visibility: "public" | "members_only" | "premium_only" | "chapter_only" | "committee_only";
  allowedRoles?: string[];
  allowedChapters?: string[];
  allowedCommittees?: string[];

  // Version control
  version: number;
  parentPublicationId?: string; // for translations or versions
  language: string;

  // Interaction settings
  commentsEnabled: boolean;
  sharingEnabled: boolean;
  downloadEnabled: boolean;

  // Featured and priority
  isFeatured: boolean;
  isPinned: boolean;
  priority: number;
}
