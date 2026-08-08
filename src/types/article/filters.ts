import type {
  ArticleCategory,
  ArticleDifficulty,
  ArticleFormat,
  ArticleStatus,
  ArticleType,
} from "./base";

export interface ArticleFilters {
  search?: string;
  status?: ArticleStatus[];
  type?: ArticleType[];
  category?: ArticleCategory[];
  difficulty?: ArticleDifficulty[];
  format?: ArticleFormat[];
  author?: string[];
  tags?: string[];
  series?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  visibility?: string[];
  featured?: boolean;
  hasSeries?: boolean;
  minReadTime?: number;
  maxReadTime?: number;
  minEngagement?: number;
  maxEngagement?: number;
  sortBy?:
    | "title"
    | "publishedAt"
    | "views"
    | "reads"
    | "engagement"
    | "readTime"
    | "completionRate"
    | "author"
    | "category";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}
