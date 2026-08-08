import type { PublicationCategory, PublicationStatus, PublicationType } from "./base";

// Export type constants for re-use
export const PUBLICATION_TYPES: PublicationType[] = [
  "article",
  "blog",
  "newsletter",
  "report",
  "case_study",
  "whitepaper",
  "research_paper",
] as const;

export const PUBLICATION_CATEGORIES: PublicationCategory[] = [
  "technology",
  "business",
  "research",
  "education",
  "industry_trends",
  "best_practices",
  "case_studies",
  "announcements",
  "member_spotlight",
  "chapter_news",
] as const;

export const PUBLICATION_STATUSES: PublicationStatus[] = [
  "draft",
  "review",
  "published",
  "archived",
  "scheduled",
] as const;
