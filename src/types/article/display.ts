import type {
  ArticleCategory,
  ArticleDifficulty,
  ArticleFormat,
  ArticleStatus,
  ArticleType,
} from "./base";

// Display information

export const ARTICLE_TYPE_DISPLAY: Record<
  ArticleType,
  {
    name: string;
    description: string;
    icon: string;
    color: string;
  }
> = {
  tutorial: {
    name: "Tutorial",
    description: "Step-by-step instructional content",
    icon: "book-open",
    color: "blue",
  },
  guide: {
    name: "Guide",
    description: "Comprehensive guide on a topic",
    icon: "compass",
    color: "green",
  },
  opinion: {
    name: "Opinion",
    description: "Personal viewpoint or analysis",
    icon: "message-square",
    color: "purple",
  },
  case_study: {
    name: "Case Study",
    description: "Detailed analysis of a specific case",
    icon: "briefcase",
    color: "orange",
  },
  research_summary: {
    name: "Research Summary",
    description: "Summary of research findings",
    icon: "microscope",
    color: "indigo",
  },
  news: {
    name: "News",
    description: "Latest news and updates",
    icon: "newspaper",
    color: "red",
  },
  interview: {
    name: "Interview",
    description: "Interview with industry experts",
    icon: "users",
    color: "cyan",
  },
};

export const ARTICLE_CATEGORY_DISPLAY: Record<
  ArticleCategory,
  {
    name: string;
    description: string;
    icon: string;
    color: string;
  }
> = {
  technology: {
    name: "Technology",
    description: "Technology-related articles and tutorials",
    icon: "cpu",
    color: "blue",
  },
  business: {
    name: "Business",
    description: "Business and management articles",
    icon: "briefcase",
    color: "green",
  },
  education: {
    name: "Education",
    description: "Educational content and learning resources",
    icon: "graduation-cap",
    color: "orange",
  },
  research: {
    name: "Research",
    description: "Research findings and academic content",
    icon: "microscope",
    color: "purple",
  },
  industry_trends: {
    name: "Industry Trends",
    description: "Latest industry trends and insights",
    icon: "trending-up",
    color: "indigo",
  },
  best_practices: {
    name: "Best Practices",
    description: "Best practices and guidelines",
    icon: "check-circle",
    color: "emerald",
  },
  member_stories: {
    name: "Member Stories",
    description: "Stories and experiences from members",
    icon: "users",
    color: "pink",
  },
  chapter_news: {
    name: "Chapter News",
    description: "Chapter-specific news and updates",
    icon: "building",
    color: "cyan",
  },
  announcements: {
    name: "Announcements",
    description: "Official announcements and notices",
    icon: "megaphone",
    color: "red",
  },
  career_development: {
    name: "Career Development",
    description: "Career growth and professional development",
    icon: "trending-up",
    color: "amber",
  },
};

export const ARTICLE_STATUS_DISPLAY: Record<
  ArticleStatus,
  {
    name: string;
    description: string;
    icon: string;
    color: string;
    badgeVariant: "default" | "secondary" | "destructive" | "outline";
  }
> = {
  draft: {
    name: "Draft",
    description: "Work in progress, not published",
    icon: "edit",
    color: "slate",
    badgeVariant: "secondary",
  },
  review: {
    name: "Under Review",
    description: "Pending review and approval",
    icon: "clock",
    color: "amber",
    badgeVariant: "outline",
  },
  published: {
    name: "Published",
    description: "Live and accessible to readers",
    icon: "check-circle",
    color: "emerald",
    badgeVariant: "default",
  },
  archived: {
    name: "Archived",
    description: "No longer active but preserved",
    icon: "archive",
    color: "slate",
    badgeVariant: "secondary",
  },
  scheduled: {
    name: "Scheduled",
    description: "Scheduled for future publication",
    icon: "calendar",
    color: "blue",
    badgeVariant: "outline",
  },
};

export const ARTICLE_DIFFICULTY_DISPLAY: Record<
  ArticleDifficulty,
  {
    name: string;
    description: string;
    icon: string;
    color: string;
  }
> = {
  beginner: {
    name: "Beginner",
    description: "Suitable for newcomers to the topic",
    icon: "star",
    color: "green",
  },
  intermediate: {
    name: "Intermediate",
    description: "Requires some prior knowledge",
    icon: "star-half",
    color: "amber",
  },
  advanced: {
    name: "Advanced",
    description: "Requires extensive knowledge and experience",
    icon: "zap",
    color: "red",
  },
};

export const ARTICLE_FORMAT_DISPLAY: Record<
  ArticleFormat,
  {
    name: string;
    description: string;
    icon: string;
    color: string;
  }
> = {
  standard: {
    name: "Standard Article",
    description: "Traditional article format",
    icon: "file-text",
    color: "blue",
  },
  tutorial: {
    name: "Tutorial",
    description: "Step-by-step instructional content",
    icon: "book-open",
    color: "green",
  },
  listicle: {
    name: "Listicle",
    description: "Article presented as a list",
    icon: "list",
    color: "purple",
  },
  interview: {
    name: "Interview",
    description: "Q&A format with experts",
    icon: "users",
    color: "orange",
  },
  case_study: {
    name: "Case Study",
    description: "Detailed analysis of specific cases",
    icon: "briefcase",
    color: "indigo",
  },
};
