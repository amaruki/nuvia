import type { ArticleFilters } from "@/types/article.types";

export const DEFAULT_FILTERS: ArticleFilters = {
  search: "",
  status: [],
  type: [],
  category: [],
  difficulty: [],
  format: [],
  author: [],
  tags: [],
  series: [],
  dateRange: undefined,
  visibility: [],
  featured: undefined,
  hasSeries: undefined,
  minReadTime: undefined,
  maxReadTime: undefined,
  minEngagement: undefined,
  maxEngagement: undefined,
  sortBy: "publishedAt",
  sortOrder: "desc",
  page: 1,
  limit: 10,
};

export const ITEMS_PER_PAGE = 10;

export const EMPTY_METRICS = {
  views: 0,
  reads: 0,
  shares: 0,
  comments: 0,
  likes: 0,
  bookmarks: 0,
  averageReadTime: 0,
  completionRate: 0,
  engagementScore: 0,
  bounceRate: 0,
};
