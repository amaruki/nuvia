import type { ArticleStatistics } from "@/types/article";

import type { AnnouncementPriority, AnnouncementTargetAudience, AnnouncementType } from "./base";

export interface AnnouncementStatistics {
  // Basic announcement statistics
  totalAnnouncements: number;
  // Carried over from the underlying article statistics this is derived
  // from (convertArticleStatisticsToAnnouncementStatistics in use-announcements.ts)
  totalArticles: number;
  publishedArticles: number;
  draftArticles: number;
  scheduledArticles: number;
  archivedArticles: number;
  topPerformingArticles: ArticleStatistics["topPerformingArticles"];
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
