import type {
  ArticleCategory,
  ArticleDifficulty,
  ArticleFormat,
  ArticleStatus,
  ArticleType,
} from "./base";

// Export type constants for re-use

export const ARTICLE_TYPES: ArticleType[] = [
  "tutorial",
  "guide",
  "opinion",
  "case_study",
  "research_summary",
  "news",
  "interview",
] as const;

export const ARTICLE_CATEGORIES: ArticleCategory[] = [
  "technology",
  "business",
  "education",
  "research",
  "industry_trends",
  "best_practices",
  "member_stories",
  "chapter_news",
  "announcements",
  "career_development",
] as const;

export const ARTICLE_STATUSES: ArticleStatus[] = [
  "draft",
  "review",
  "published",
  "archived",
  "scheduled",
] as const;

export const ARTICLE_DIFFICULTIES: ArticleDifficulty[] = [
  "beginner",
  "intermediate",
  "advanced",
] as const;

export const ARTICLE_FORMATS: ArticleFormat[] = [
  "standard",
  "tutorial",
  "listicle",
  "interview",
  "case_study",
] as const;
