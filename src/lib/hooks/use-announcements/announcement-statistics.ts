import type { Announcement, AnnouncementStatistics } from "@/types/announcement";
import type { ArticleCategory, ArticleType } from "@/types/article";

import {
  ANNOUNCEMENT_PRIORITIES,
  ANNOUNCEMENT_TARGET_AUDIENCES,
  ANNOUNCEMENT_TYPES,
} from "@/types/announcement";

export function buildAnnouncementStatistics(announcements: Announcement[]): AnnouncementStatistics {
  const now = new Date();

  return {
    totalAnnouncements: announcements.length,
    totalArticles: announcements.length,
    publishedArticles: announcements.filter((a) => a.status === "published").length,
    draftArticles: announcements.filter((a) => a.status === "draft").length,
    scheduledArticles: announcements.filter((a) => a.status === "scheduled").length,
    archivedArticles: announcements.filter((a) => a.status === "archived").length,
    topPerformingArticles: announcements
      .slice()
      .sort((a, b) => b.metrics.engagementScore - a.metrics.engagementScore)
      .slice(0, 10)
      .map((a) => ({
        articleId: a.id,
        title: a.title,
        author: a.author.name,
        views: a.metrics.views,
        reads: a.metrics.reads,
        engagementScore: a.metrics.engagementScore,
        completionRate: a.metrics.completionRate,
        type: a.type as unknown as ArticleType,
        category: a.category as unknown as ArticleCategory,
      })),
    announcementsByType: ANNOUNCEMENT_TYPES.map((type) => ({
      type,
      count: announcements.filter((a) => a.type === type).length,
    })),
    announcementsByPriority: ANNOUNCEMENT_PRIORITIES.map((priority) => ({
      priority,
      count: announcements.filter((a) => a.priority === priority).length,
    })),
    announcementsByTargetAudience: ANNOUNCEMENT_TARGET_AUDIENCES.map((targetAudience) => ({
      targetAudience,
      count: announcements.filter((a) => a.targetAudience === targetAudience).length,
    })),
    totalAcknowledgments: announcements.reduce((sum, a) => sum + (a.acknowledgmentCount || 0), 0),
    averageAcknowledgmentRate:
      announcements.length > 0
        ? Math.round(
            announcements.reduce((sum, a) => sum + (a.acknowledgmentCount || 0), 0) /
              announcements.length,
          )
        : 0,
    urgentAnnouncements: announcements.filter((a) => a.isUrgent).length,
    pinnedAnnouncements: announcements.filter((a) => a.isPinned).length,
    expiredAnnouncements: announcements.filter((a) => a.expiresAt && a.expiresAt < now).length,
    activeAnnouncements: announcements.filter(
      (a) => a.status === "published" && (!a.expiresAt || a.expiresAt >= now),
    ).length,
  };
}
