// Publication types for Nuvia community platform

export type PublicationStatus = 'draft' | 'review' | 'published' | 'archived' | 'scheduled';

export type PublicationType = 'article' | 'blog' | 'newsletter' | 'report' | 'case_study' | 'whitepaper' | 'research_paper';

export type PublicationCategory = 
  | 'technology'
  | 'business'
  | 'research'
  | 'education'
  | 'industry_trends'
  | 'best_practices'
  | 'case_studies'
  | 'announcements'
  | 'member_spotlight'
  | 'chapter_news';

export interface PublicationAuthor {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
  role: string;
  chapter?: string;
  committee?: string;
}

export interface PublicationTag {
  id: string;
  name: string;
  color: string;
  count: number;
}

export interface PublicationMetrics {
  views: number;
  downloads: number;
  shares: number;
  comments: number;
  likes: number;
  bookmarks: number;
  averageReadTime: number; // in minutes
  bounceRate: number; // percentage
  engagementScore: number; // calculated score 0-100
}

export interface PublicationSEO {
  title: string;
  description: string;
  keywords: string[];
  ogImage?: string;
  canonicalUrl?: string;
}

export interface Publication {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  type: PublicationType;
  category: PublicationCategory;
  status: PublicationStatus;
  author: PublicationAuthor;
  coAuthors?: PublicationAuthor[];
  tags: PublicationTag[];
  featuredImage?: string;
  gallery?: string[];
  attachments?: {
    id: string;
    name: string;
    url: string;
    size: number;
    type: string;
  }[];
  
  // Publishing details
  publishedAt?: Date;
  scheduledFor?: Date;
  lastModified: Date;
  reviewedBy?: string;
  reviewedAt?: Date;
  
  // Content details
  readTime: number; // in minutes
  wordCount: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  
  // SEO and metadata
  seo: PublicationSEO;
  
  // Metrics and analytics
  metrics: PublicationMetrics;
  
  // Access control
  visibility: 'public' | 'members_only' | 'premium_only' | 'chapter_only' | 'committee_only';
  allowedRoles?: string[];
  allowedChapters?: string[];
  allowedCommittees?: string[];
  
  // Version control
  version: number;
  parentPublicationId?: string; // for translations or versions
  language: string;
  
  // Interaction settings
  commentsEnabled: boolean;
  sharingEnabled: boolean;
  downloadEnabled: boolean;
  
  // Featured and priority
  isFeatured: boolean;
  isPinned: boolean;
  priority: number;
}

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
    action: 'created' | 'published' | 'updated' | 'archived';
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
  sortBy?: 'title' | 'publishedAt' | 'views' | 'engagement' | 'author' | 'category';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface PublicationFormData {
  title: string;
  slug?: string;
  excerpt: string;
  content: string;
  type: PublicationType;
  category: PublicationCategory;
  status: PublicationStatus;
  authorId: string;
  coAuthorIds?: string[];
  tagIds: string[];
  featuredImage?: string;
  gallery?: string[];
  attachments?: File[];
  
  // Publishing
  publishedAt?: Date;
  scheduledFor?: Date;
  
  // Content details
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  
  // SEO
  seo: {
    title: string;
    description: string;
    keywords: string[];
    ogImage?: string;
  };
  
  // Access control
  visibility: 'public' | 'members_only' | 'premium_only' | 'chapter_only' | 'committee_only';
  allowedRoles?: string[];
  allowedChapters?: string[];
  allowedCommittees?: string[];
  
  // Interaction settings
  commentsEnabled: boolean;
  sharingEnabled: boolean;
  downloadEnabled: boolean;
  
  // Featured
  isFeatured: boolean;
  isPinned: boolean;
  priority: number;
}

// Export type constants for re-use
export const PUBLICATION_TYPES: PublicationType[] = [
  'article', 'blog', 'newsletter', 'report', 'case_study', 'whitepaper', 'research_paper'
] as const;

export const PUBLICATION_CATEGORIES: PublicationCategory[] = [
  'technology', 'business', 'research', 'education', 'industry_trends',
  'best_practices', 'case_studies', 'announcements', 'member_spotlight', 'chapter_news'
] as const;

export const PUBLICATION_STATUSES: PublicationStatus[] = [
  'draft', 'review', 'published', 'archived', 'scheduled'
] as const;

// Display information
export const PUBLICATION_TYPE_DISPLAY: Record<PublicationType, {
  name: string;
  description: string;
  icon: string;
  color: string;
}> = {
  article: {
    name: 'Article',
    description: 'In-depth article on a specific topic',
    icon: 'file-text',
    color: 'blue'
  },
  blog: {
    name: 'Blog Post',
    description: 'Informal blog post or news update',
    icon: 'edit',
    color: 'green'
  },
  newsletter: {
    name: 'Newsletter',
    description: 'Regular newsletter or digest',
    icon: 'mail',
    color: 'purple'
  },
  report: {
    name: 'Report',
    description: 'Formal report or analysis',
    icon: 'bar-chart',
    color: 'orange'
  },
  case_study: {
    name: 'Case Study',
    description: 'Detailed case study analysis',
    icon: 'briefcase',
    color: 'indigo'
  },
  whitepaper: {
    name: 'Whitepaper',
    description: 'Authoritative report or guide',
    icon: 'file',
    color: 'slate'
  },
  research_paper: {
    name: 'Research Paper',
    description: 'Academic or research publication',
    icon: 'book-open',
    color: 'rose'
  }
};

export const PUBLICATION_CATEGORY_DISPLAY: Record<PublicationCategory, {
  name: string;
  description: string;
  icon: string;
  color: string;
}> = {
  technology: {
    name: 'Technology',
    description: 'Technology-related content',
    icon: 'cpu',
    color: 'blue'
  },
  business: {
    name: 'Business',
    description: 'Business and management content',
    icon: 'briefcase',
    color: 'green'
  },
  research: {
    name: 'Research',
    description: 'Research findings and studies',
    icon: 'microscope',
    color: 'purple'
  },
  education: {
    name: 'Education',
    description: 'Educational content and tutorials',
    icon: 'graduation-cap',
    color: 'orange'
  },
  industry_trends: {
    name: 'Industry Trends',
    description: 'Latest industry trends and insights',
    icon: 'trending-up',
    color: 'indigo'
  },
  best_practices: {
    name: 'Best Practices',
    description: 'Best practices and guidelines',
    icon: 'check-circle',
    color: 'emerald'
  },
  case_studies: {
    name: 'Case Studies',
    description: 'Real-world case studies and examples',
    icon: 'folder',
    color: 'slate'
  },
  announcements: {
    name: 'Announcements',
    description: 'Official announcements and news',
    icon: 'megaphone',
    color: 'red'
  },
  member_spotlight: {
    name: 'Member Spotlight',
    description: 'Featured member stories and profiles',
    icon: 'star',
    color: 'yellow'
  },
  chapter_news: {
    name: 'Chapter News',
    description: 'Chapter-specific news and updates',
    icon: 'building',
    color: 'cyan'
  }
};

export const PUBLICATION_STATUS_DISPLAY: Record<PublicationStatus, {
  name: string;
  description: string;
  icon: string;
  color: string;
  badgeVariant: 'default' | 'secondary' | 'destructive' | 'outline';
}> = {
  draft: {
    name: 'Draft',
    description: 'Work in progress, not published',
    icon: 'edit',
    color: 'slate',
    badgeVariant: 'secondary'
  },
  review: {
    name: 'Under Review',
    description: 'Pending review and approval',
    icon: 'clock',
    color: 'amber',
    badgeVariant: 'outline'
  },
  published: {
    name: 'Published',
    description: 'Live and accessible to readers',
    icon: 'check-circle',
    color: 'emerald',
    badgeVariant: 'default'
  },
  archived: {
    name: 'Archived',
    description: 'No longer active but preserved',
    icon: 'archive',
    color: 'slate',
    badgeVariant: 'secondary'
  },
  scheduled: {
    name: 'Scheduled',
    description: 'Scheduled for future publication',
    icon: 'calendar',
    color: 'blue',
    badgeVariant: 'outline'
  }
};
