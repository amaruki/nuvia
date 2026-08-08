import type { ArticleFilters } from "@/types/article";

import type { AnnouncementPriority, AnnouncementTargetAudience, AnnouncementType } from "./base";

// Announcement filters extending ArticleFilters
export interface AnnouncementFilters extends Omit<
  ArticleFilters,
  "type" | "category" | "difficulty" | "format"
> {
  // Override with announcement-specific filters
  type?: AnnouncementType[];
  category?: ["announcements"]; // Always announcements
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
