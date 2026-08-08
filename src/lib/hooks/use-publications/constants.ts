import type { PublicationFilters } from "@/types/publication.types";

export const DEFAULT_FILTERS: PublicationFilters = {
  search: "",
  status: [],
  type: [],
  category: [],
  author: [],
  tags: [],
  dateRange: undefined,
  visibility: [],
  featured: undefined,
  sortBy: "publishedAt",
  sortOrder: "desc",
  page: 1,
  limit: 10,
};

export const ITEMS_PER_PAGE = 10;

export const EMPTY_METRICS = {
  views: 0,
  downloads: 0,
  shares: 0,
  comments: 0,
  likes: 0,
  bookmarks: 0,
  averageReadTime: 0,
  bounceRate: 0,
  engagementScore: 0,
};
