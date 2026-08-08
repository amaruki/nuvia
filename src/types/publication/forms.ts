import type { PublicationCategory, PublicationStatus, PublicationType } from "./base";

export interface PublicationFormData {
  title: string;
  slug?: string;
  excerpt: string;
  content: string;
  type: PublicationType;
  category: PublicationCategory;
  status: PublicationStatus;
  authorId: string;
  coAuthorIds?: string[];
  tagIds: string[];
  featuredImage?: string;
  gallery?: string[];
  attachments?: File[];

  // Publishing
  publishedAt?: Date;
  scheduledFor?: Date;

  // Content details
  difficulty: "beginner" | "intermediate" | "advanced";

  // SEO
  seo: {
    title: string;
    description: string;
    keywords: string[];
    ogImage?: string;
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
  isPinned: boolean;
  priority: number;
}
