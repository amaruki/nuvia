import type { Publication, PublicationStatistics } from "@/types/publication.types";

import {
  PUBLICATION_CATEGORIES,
  PUBLICATION_STATUSES,
  PUBLICATION_TYPES,
} from "@/types/publication.types";

export function buildPublicationStatistics(publications: Publication[]): PublicationStatistics {
  const now = new Date();
  const average = (values: number[]) =>
    values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  const monthKey = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

  const recentActivity = publications
    .slice()
    .sort(
      (a, b) =>
        (b.publishedAt ?? b.lastModified).getTime() - (a.publishedAt ?? a.lastModified).getTime(),
    )
    .slice(0, 10)
    .map((publication) => ({
      id: `${publication.id}-activity`,
      publicationId: publication.id,
      title: publication.title,
      action: (publication.publishedAt ? "published" : "updated") as "published" | "updated",
      author: publication.author.name,
      timestamp: publication.publishedAt ?? publication.lastModified,
    }));

  const monthlyTrend = Array.from({ length: 6 }, (_, index) => {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    const key = monthKey(monthDate);
    const inMonth = publications.filter((p) => monthKey(p.lastModified) === key);
    return {
      month: key,
      publicationsCreated: inMonth.length,
      publicationsPublished: inMonth.filter((p) => p.publishedAt).length,
      totalViews: inMonth.reduce((acc, p) => acc + p.metrics.views, 0),
      totalEngagement: inMonth.reduce((acc, p) => acc + p.metrics.engagementScore, 0),
    };
  });

  return {
    totalPublications: publications.length,
    publishedPublications: publications.filter((p) => p.status === "published").length,
    draftPublications: publications.filter((p) => p.status === "draft").length,
    scheduledPublications: publications.filter((p) => p.status === "scheduled").length,
    archivedPublications: publications.filter((p) => p.status === "archived").length,
    totalViews: publications.reduce((acc, p) => acc + p.metrics.views, 0),
    totalDownloads: publications.reduce((acc, p) => acc + p.metrics.downloads, 0),
    totalShares: publications.reduce((acc, p) => acc + p.metrics.shares, 0),
    totalComments: publications.reduce((acc, p) => acc + p.metrics.comments, 0),
    averageEngagementScore: average(publications.map((p) => p.metrics.engagementScore)),
    publicationsByType: PUBLICATION_TYPES.map((type) => {
      const items = publications.filter((p) => p.type === type);
      return {
        type,
        count: items.length,
        views: items.reduce((acc, p) => acc + p.metrics.views, 0),
        engagement: average(items.map((p) => p.metrics.engagementScore)),
      };
    }),
    publicationsByCategory: PUBLICATION_CATEGORIES.map((category) => {
      const items = publications.filter((p) => p.category === category);
      return {
        category,
        count: items.length,
        views: items.reduce((acc, p) => acc + p.metrics.views, 0),
        engagement: average(items.map((p) => p.metrics.engagementScore)),
      };
    }),
    publicationsByStatus: PUBLICATION_STATUSES.map((status) => ({
      status,
      count: publications.filter((p) => p.status === status).length,
    })),
    topPerformingPublications: publications
      .slice()
      .sort((a, b) => b.metrics.engagementScore - a.metrics.engagementScore)
      .slice(0, 10)
      .map((p) => ({
        publicationId: p.id,
        title: p.title,
        author: p.author.name,
        views: p.metrics.views,
        engagementScore: p.metrics.engagementScore,
        type: p.type,
        category: p.category,
      })),
    recentActivity,
    monthlyTrend,
  };
}
