import type { PublicationCategory, PublicationStatus, PublicationType } from "./base";

// Display information
export const PUBLICATION_TYPE_DISPLAY: Record<
  PublicationType,
  {
    name: string;
    description: string;
    icon: string;
    color: string;
  }
> = {
  article: {
    name: "Article",
    description: "In-depth article on a specific topic",
    icon: "file-text",
    color: "blue",
  },
  blog: {
    name: "Blog Post",
    description: "Informal blog post or news update",
    icon: "edit",
    color: "green",
  },
  newsletter: {
    name: "Newsletter",
    description: "Regular newsletter or digest",
    icon: "mail",
    color: "purple",
  },
  report: {
    name: "Report",
    description: "Formal report or analysis",
    icon: "bar-chart",
    color: "orange",
  },
  case_study: {
    name: "Case Study",
    description: "Detailed case study analysis",
    icon: "briefcase",
    color: "indigo",
  },
  whitepaper: {
    name: "Whitepaper",
    description: "Authoritative report or guide",
    icon: "file",
    color: "slate",
  },
  research_paper: {
    name: "Research Paper",
    description: "Academic or research publication",
    icon: "book-open",
    color: "rose",
  },
};

export const PUBLICATION_CATEGORY_DISPLAY: Record<
  PublicationCategory,
  {
    name: string;
    description: string;
    icon: string;
    color: string;
  }
> = {
  technology: {
    name: "Technology",
    description: "Technology-related content",
    icon: "cpu",
    color: "blue",
  },
  business: {
    name: "Business",
    description: "Business and management content",
    icon: "briefcase",
    color: "green",
  },
  research: {
    name: "Research",
    description: "Research findings and studies",
    icon: "microscope",
    color: "purple",
  },
  education: {
    name: "Education",
    description: "Educational content and tutorials",
    icon: "graduation-cap",
    color: "orange",
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
  case_studies: {
    name: "Case Studies",
    description: "Real-world case studies and examples",
    icon: "folder",
    color: "slate",
  },
  announcements: {
    name: "Announcements",
    description: "Official announcements and news",
    icon: "megaphone",
    color: "red",
  },
  member_spotlight: {
    name: "Member Spotlight",
    description: "Featured member stories and profiles",
    icon: "star",
    color: "yellow",
  },
  chapter_news: {
    name: "Chapter News",
    description: "Chapter-specific news and updates",
    icon: "building",
    color: "cyan",
  },
};

export const PUBLICATION_STATUS_DISPLAY: Record<
  PublicationStatus,
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
