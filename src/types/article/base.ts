// Article types for Nuvia community platform

export type ArticleStatus = "draft" | "review" | "published" | "archived" | "scheduled";

export type ArticleType =
  | "tutorial"
  | "guide"
  | "opinion"
  | "case_study"
  | "research_summary"
  | "news"
  | "interview";

export type ArticleCategory =
  | "technology"
  | "business"
  | "education"
  | "research"
  | "industry_trends"
  | "best_practices"
  | "member_stories"
  | "chapter_news"
  | "announcements"
  | "career_development";

export type ArticleDifficulty = "beginner" | "intermediate" | "advanced";

export type ArticleFormat = "standard" | "tutorial" | "listicle" | "interview" | "case_study";
