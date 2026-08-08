import type { PublicationCategory, PublicationStatus, PublicationType } from "./base";

export interface PublicationStatistics {
  totalPublications: number;
  publishedPublications: number;
  draftPublications: number;
  scheduledPublications: number;
  archivedPublications: number;

  // Metrics
  totalViews: number;
  totalDownloads: number;
  totalShares: number;
  totalComments: number;
  averageEngagementScore: number;

  // By type
  publicationsByType: {
    type: PublicationType;
    count: number;
    views: number;
    engagement: number;
  }[];

  // By category
  publicationsByCategory: {
    category: PublicationCategory;
    count: number;
    views: number;
    engagement: number;
  }[];

  // By status
  publicationsByStatus: {
    status: PublicationStatus;
    count: number;
  }[];

  // Top performing
  topPerformingPublications: {
    publicationId: string;
    title: string;
    author: string;
    views: number;
    engagementScore: number;
    type: PublicationType;
    category: PublicationCategory;
  }[];

  // Recent activity
  recentActivity: {
    id: string;
    publicationId: string;
    title: string;
    action: "created" | "published" | "updated" | "archived";
    author: string;
    timestamp: Date;
  }[];

  // Monthly trends
  monthlyTrend: {
    month: string;
    publicationsCreated: number;
    publicationsPublished: number;
    totalViews: number;
    totalEngagement: number;
  }[];
}

export interface PublicationFilters {
  search?: string;
  status?: PublicationStatus[];
  type?: PublicationType[];
  category?: PublicationCategory[];
  author?: string[];
  tags?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  visibility?: string[];
  featured?: boolean;
  sortBy?: "title" | "publishedAt" | "views" | "engagement" | "author" | "category";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}
