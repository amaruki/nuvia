import { 
  Publication, 
  PublicationStatistics, 
  PublicationAuthor, 
  PublicationTag,
  PublicationType,
  PublicationCategory,
  PublicationStatus,
  PUBLICATION_TYPES,
  PUBLICATION_CATEGORIES,
  PUBLICATION_STATUSES
} from "@/types/publication.types";

// Mock authors
const mockAuthors: PublicationAuthor[] = [
  {
    id: "author_1",
    name: "Dr. Sarah Johnson",
    email: "sarah.johnson@nuvia.org",
    avatar: "/avatars/sarah.jpg",
    bio: "Research scientist with expertise in AI and machine learning",
    role: "Research Director",
    chapter: "San Francisco Bay Area",
    committee: "Technology Committee"
  },
  {
    id: "author_2",
    name: "Michael Chen",
    email: "michael.chen@nuvia.org",
    avatar: "/avatars/michael.jpg",
    bio: "Business strategist and management consultant",
    role: "Business Analyst",
    chapter: "New York Metro",
    committee: "Business Development"
  },
  {
    id: "author_3",
    name: "Emily Rodriguez",
    email: "emily.rodriguez@nuvia.org",
    avatar: "/avatars/emily.jpg",
    bio: "Education specialist and curriculum developer",
    role: "Education Lead",
    chapter: "Austin",
    committee: "Education Committee"
  },
  {
    id: "author_4",
    name: "James Wilson",
    email: "james.wilson@nuvia.org",
    avatar: "/avatars/james.jpg",
    bio: "Industry analyst and trends researcher",
    role: "Industry Analyst",
    chapter: "Chicago",
    committee: "Research Committee"
  },
  {
    id: "author_5",
    name: "Lisa Thompson",
    email: "lisa.thompson@nuvia.org",
    avatar: "/avatars/lisa.jpg",
    bio: "Chapter president and community organizer",
    role: "Chapter President",
    chapter: "Seattle"
  }
];

// Mock tags
const mockTags: PublicationTag[] = [
  { id: "tag_1", name: "artificial-intelligence", color: "#3B82F6", count: 45 },
  { id: "tag_2", name: "machine-learning", color: "#10B981", count: 38 },
  { id: "tag_3", name: "business-strategy", color: "#F59E0B", count: 32 },
  { id: "tag_4", name: "digital-transformation", color: "#8B5CF6", count: 28 },
  { id: "tag_5", name: "best-practices", color: "#EF4444", count: 41 },
  { id: "tag_6", name: "case-study", color: "#06B6D4", count: 24 },
  { id: "tag_7", name: "research", color: "#84CC16", count: 36 },
  { id: "tag_8", name: "education", color: "#F97316", count: 29 },
  { id: "tag_9", name: "industry-trends", color: "#6366F1", count: 33 },
  { id: "tag_10", name: "innovation", color: "#EC4899", count: 27 }
];

// Mock publications
const mockPublications: Publication[] = [
  {
    id: "pub_1",
    title: "The Future of Artificial Intelligence in Community Management",
    slug: "future-ai-community-management",
    excerpt: "Exploring how AI technologies are revolutionizing community management and member engagement strategies for modern organizations.",
    content: "Artificial Intelligence is transforming how communities are managed and engaged. This comprehensive analysis explores the latest AI technologies, their applications in community management, and practical implementation strategies for organizations looking to leverage these powerful tools...",
    type: "research_paper",
    category: "technology",
    status: "published",
    author: mockAuthors[0],
    coAuthors: [mockAuthors[3]],
    tags: [mockTags[0], mockTags[1], mockTags[8]],
    featuredImage: "/images/ai-community.jpg",
    gallery: ["/images/ai-1.jpg", "/images/ai-2.jpg"],
    publishedAt: new Date("2024-11-15T10:00:00Z"),
    lastModified: new Date("2024-11-14T15:30:00Z"),
    readTime: 12,
    wordCount: 2400,
    difficulty: "advanced",
    seo: {
      title: "The Future of AI in Community Management | Nuvia Research",
      description: "Explore how AI is revolutionizing community management with cutting-edge technologies and strategies.",
      keywords: ["AI", "community management", "artificial intelligence", "member engagement"],
      ogImage: "/images/ai-community-og.jpg"
    },
    metrics: {
      views: 1250,
      downloads: 180,
      shares: 45,
      comments: 23,
      likes: 89,
      bookmarks: 67,
      averageReadTime: 8.5,
      bounceRate: 25.3,
      engagementScore: 87
    },
    visibility: "public",
    version: 1,
    language: "en",
    commentsEnabled: true,
    sharingEnabled: true,
    downloadEnabled: true,
    isFeatured: true,
    isPinned: false,
    priority: 5
  },
  {
    id: "pub_2",
    title: "Digital Transformation Strategies for Non-Profit Organizations",
    slug: "digital-transformation-nonprofit-strategies",
    excerpt: "A comprehensive guide to implementing digital transformation initiatives in non-profit organizations with limited resources and budgets.",
    content: "Digital transformation can seem daunting for non-profit organizations operating with limited resources. This guide provides practical strategies, step-by-step implementation plans, and real-world case studies of successful digital transformations in the non-profit sector...",
    type: "case_study",
    category: "business",
    status: "published",
    author: mockAuthors[1],
    tags: [mockTags[3], mockTags[2], mockTags[4]],
    featuredImage: "/images/digital-transform.jpg",
    publishedAt: new Date("2024-11-10T14:30:00Z"),
    lastModified: new Date("2024-11-09T11:20:00Z"),
    readTime: 15,
    wordCount: 3000,
    difficulty: "intermediate",
    seo: {
      title: "Digital Transformation for Non-Profits | Nuvia Case Study",
      description: "Practical digital transformation strategies for non-profit organizations with limited resources.",
      keywords: ["digital transformation", "non-profit", "technology strategy", "case study"]
    },
    metrics: {
      views: 980,
      downloads: 145,
      shares: 32,
      comments: 18,
      likes: 76,
      bookmarks: 54,
      averageReadTime: 11.2,
      bounceRate: 28.7,
      engagementScore: 82
    },
    visibility: "members_only",
    version: 1,
    language: "en",
    commentsEnabled: true,
    sharingEnabled: true,
    downloadEnabled: true,
    isFeatured: false,
    isPinned: false,
    priority: 3
  },
  {
    id: "pub_3",
    title: "Building Effective Educational Programs for Professional Communities",
    slug: "effective-educational-programs-communities",
    excerpt: "Best practices and methodologies for creating engaging educational programs that drive member retention and skill development.",
    content: "Educational programs are the backbone of professional communities. This comprehensive guide covers curriculum design, delivery methods, assessment strategies, and continuous improvement processes for creating educational programs that truly engage members and drive professional development...",
    type: "article",
    category: "education",
    status: "published",
    author: mockAuthors[2],
    tags: [mockTags[7], mockTags[4], mockTags[9]],
    featuredImage: "/images/education-programs.jpg",
    publishedAt: new Date("2024-11-05T09:15:00Z"),
    lastModified: new Date("2024-11-04T16:45:00Z"),
    readTime: 10,
    wordCount: 2000,
    difficulty: "beginner",
    seo: {
      title: "Educational Programs for Professional Communities | Nuvia Guide",
      description: "Best practices for creating engaging educational programs that drive member retention.",
      keywords: ["education", "professional development", "community programs", "best practices"]
    },
    metrics: {
      views: 1450,
      downloads: 220,
      shares: 58,
      comments: 31,
      likes: 112,
      bookmarks: 89,
      averageReadTime: 7.8,
      bounceRate: 22.1,
      engagementScore: 91
    },
    visibility: "public",
    version: 1,
    language: "en",
    commentsEnabled: true,
    sharingEnabled: true,
    downloadEnabled: true,
    isFeatured: true,
    isPinned: true,
    priority: 8
  },
  {
    id: "pub_4",
    title: "Industry Trends Report: Q4 2024 Community Management Insights",
    slug: "q4-2024-community-management-trends",
    excerpt: "Comprehensive analysis of emerging trends in community management, member engagement strategies, and technology adoption patterns.",
    content: "Our quarterly industry trends report provides deep insights into the evolving landscape of community management. This Q4 2024 edition covers emerging technologies, changing member expectations, new engagement strategies, and predictions for 2025...",
    type: "report",
    category: "industry_trends",
    status: "published",
    author: mockAuthors[3],
    coAuthors: [mockAuthors[0]],
    tags: [mockTags[8], mockTags[9], mockTags[6]],
    featuredImage: "/images/q4-trends.jpg",
    attachments: [
      {
        id: "att_1",
        name: "Q4-2024-Trends-Full-Report.pdf",
        url: "/files/q4-2024-trends.pdf",
        size: 2456789,
        type: "application/pdf"
      }
    ],
    publishedAt: new Date("2024-11-01T08:00:00Z"),
    lastModified: new Date("2024-10-31T17:30:00Z"),
    readTime: 18,
    wordCount: 3600,
    difficulty: "intermediate",
    seo: {
      title: "Q4 2024 Community Management Trends Report | Nuvia Insights",
      description: "Comprehensive analysis of community management trends and insights for Q4 2024.",
      keywords: ["community management", "industry trends", "Q4 2024", "member engagement"]
    },
    metrics: {
      views: 2100,
      downloads: 450,
      shares: 89,
      comments: 42,
      likes: 156,
      bookmarks: 123,
      averageReadTime: 14.2,
      bounceRate: 19.8,
      engagementScore: 94
    },
    visibility: "premium_only",
    version: 1,
    language: "en",
    commentsEnabled: true,
    sharingEnabled: true,
    downloadEnabled: true,
    isFeatured: true,
    isPinned: false,
    priority: 7
  },
  {
    id: "pub_5",
    title: "Member Spotlight: Sarah Johnson's Journey in Technology Leadership",
    slug: "member-spotlight-sarah-johnson",
    excerpt: "An inspiring story of how Sarah Johnson rose through the ranks to become a technology leader in our community.",
    content: "Sarah Johnson's journey from a junior developer to Technology Committee chair is nothing short of inspiring. In this member spotlight, we explore her career path, challenges overcome, and vision for the future of technology in our community...",
    type: "blog",
    category: "member_spotlight",
    status: "published",
    author: mockAuthors[4],
    tags: [mockTags[9], mockTags[0]],
    featuredImage: "/images/sarah-spotlight.jpg",
    gallery: ["/images/sarah-1.jpg", "/images/sarah-2.jpg", "/images/sarah-3.jpg"],
    publishedAt: new Date("2024-10-28T12:00:00Z"),
    lastModified: new Date("2024-10-27T14:15:00Z"),
    readTime: 8,
    wordCount: 1600,
    difficulty: "beginner",
    seo: {
      title: "Member Spotlight: Sarah Johnson | Nuvia Community",
      description: "Sarah Johnson's inspiring journey to technology leadership in our community.",
      keywords: ["member spotlight", "Sarah Johnson", "technology leadership", "community story"]
    },
    metrics: {
      views: 890,
      downloads: 45,
      shares: 28,
      comments: 15,
      likes: 67,
      bookmarks: 34,
      averageReadTime: 6.5,
      bounceRate: 31.2,
      engagementScore: 76
    },
    visibility: "public",
    version: 1,
    language: "en",
    commentsEnabled: true,
    sharingEnabled: true,
    downloadEnabled: false,
    isFeatured: false,
    isPinned: false,
    priority: 2
  },
  {
    id: "pub_6",
    title: "Best Practices for Virtual Event Management in Hybrid Communities",
    slug: "virtual-event-management-hybrid-communities",
    excerpt: "Comprehensive guide to planning and executing successful virtual events that engage both remote and in-person community members.",
    content: "As communities increasingly adopt hybrid models, virtual event management has become more complex and important. This guide covers everything from platform selection and technical setup to engagement strategies and post-event analysis...",
    type: "whitepaper",
    category: "best_practices",
    status: "review",
    author: mockAuthors[2],
    coAuthors: [mockAuthors[4]],
    tags: [mockTags[4], mockTags[6], mockTags[3]],
    featuredImage: "/images/virtual-events.jpg",
    lastModified: new Date("2024-11-16T10:30:00Z"),
    readTime: 20,
    wordCount: 4000,
    difficulty: "advanced",
    seo: {
      title: "Virtual Event Management Best Practices | Nuvia Whitepaper",
      description: "Comprehensive guide to virtual event management for hybrid communities.",
      keywords: ["virtual events", "event management", "hybrid communities", "best practices"]
    },
    metrics: {
      views: 0,
      downloads: 0,
      shares: 0,
      comments: 0,
      likes: 0,
      bookmarks: 0,
      averageReadTime: 0,
      bounceRate: 0,
      engagementScore: 0
    },
    visibility: "public",
    version: 1,
    language: "en",
    commentsEnabled: false,
    sharingEnabled: false,
    downloadEnabled: false,
    isFeatured: false,
    isPinned: false,
    priority: 4
  },
  {
    id: "pub_7",
    title: "Chapter News: Seattle Chapter Launches New Mentorship Program",
    slug: "seattle-chapter-mentorship-program-launch",
    excerpt: "Exciting news from our Seattle chapter as they launch an innovative mentorship program connecting experienced members with newcomers.",
    content: "The Seattle chapter is proud to announce the launch of our new mentorship program designed to foster connections between experienced members and those new to our community. The program includes monthly meetups, skill-sharing workshops, and one-on-one mentoring sessions...",
    type: "newsletter",
    category: "chapter_news",
    status: "published",
    author: mockAuthors[4],
    tags: [mockTags[8], mockTags[7]],
    featuredImage: "/images/seattle-mentorship.jpg",
    publishedAt: new Date("2024-11-12T16:00:00Z"),
    lastModified: new Date("2024-11-11T13:45:00Z"),
    readTime: 6,
    wordCount: 1200,
    difficulty: "beginner",
    seo: {
      title: "Seattle Chapter Mentorship Program | Nuvia News",
      description: "Seattle chapter launches innovative mentorship program for community members.",
      keywords: ["Seattle chapter", "mentorship program", "community news", "member development"]
    },
    metrics: {
      views: 567,
      downloads: 23,
      shares: 12,
      comments: 8,
      likes: 34,
      bookmarks: 19,
      averageReadTime: 4.2,
      bounceRate: 35.6,
      engagementScore: 68
    },
    visibility: "chapter_only",
    allowedChapters: ["seattle"],
    version: 1,
    language: "en",
    commentsEnabled: true,
    sharingEnabled: true,
    downloadEnabled: true,
    isFeatured: false,
    isPinned: false,
    priority: 3
  },
  {
    id: "pub_8",
    title: "Machine Learning Applications in Member Engagement Analytics",
    slug: "machine-learning-member-engagement-analytics",
    excerpt: "Advanced techniques for using machine learning to analyze member engagement patterns and predict community health metrics.",
    content: "Machine learning offers powerful tools for understanding and predicting member engagement patterns. This technical paper explores advanced ML techniques, implementation strategies, and real-world applications in community management...",
    type: "research_paper",
    category: "research",
    status: "scheduled",
    author: mockAuthors[0],
    tags: [mockTags[1], mockTags[0], mockTags[6]],
    featuredImage: "/images/ml-analytics.jpg",
    scheduledFor: new Date("2024-12-01T09:00:00Z"),
    lastModified: new Date("2024-11-15T11:20:00Z"),
    readTime: 25,
    wordCount: 5000,
    difficulty: "advanced",
    seo: {
      title: "Machine Learning for Member Engagement Analytics | Nuvia Research",
      description: "Advanced ML techniques for analyzing member engagement and predicting community health.",
      keywords: ["machine learning", "member engagement", "analytics", "community health"]
    },
    metrics: {
      views: 0,
      downloads: 0,
      shares: 0,
      comments: 0,
      likes: 0,
      bookmarks: 0,
      averageReadTime: 0,
      bounceRate: 0,
      engagementScore: 0
    },
    visibility: "premium_only",
    version: 1,
    language: "en",
    commentsEnabled: true,
    sharingEnabled: true,
    downloadEnabled: true,
    isFeatured: false,
    isPinned: false,
    priority: 6
  },
  {
    id: "pub_9",
    title: "Draft: Innovation Framework for Community Growth",
    slug: "innovation-framework-community-growth",
    excerpt: "A structured approach to fostering innovation within community organizations and measuring its impact on growth.",
    content: "This is a draft publication exploring innovation frameworks for community growth. The content is still being developed and will include case studies, implementation guides, and measurement strategies...",
    type: "article",
    category: "business",
    status: "draft",
    author: mockAuthors[1],
    tags: [mockTags[9], mockTags[2]],
    lastModified: new Date("2024-11-16T09:45:00Z"),
    readTime: 0,
    wordCount: 800,
    difficulty: "intermediate",
    seo: {
      title: "Innovation Framework for Community Growth | Nuvia Draft",
      description: "Structured approach to fostering innovation in community organizations.",
      keywords: ["innovation", "community growth", "framework", "strategy"]
    },
    metrics: {
      views: 0,
      downloads: 0,
      shares: 0,
      comments: 0,
      likes: 0,
      bookmarks: 0,
      averageReadTime: 0,
      bounceRate: 0,
      engagementScore: 0
    },
    visibility: "public",
    version: 1,
    language: "en",
    commentsEnabled: false,
    sharingEnabled: false,
    downloadEnabled: false,
    isFeatured: false,
    isPinned: false,
    priority: 1
  },
  {
    id: "pub_10",
    title: "Archived: 2023 Annual Community Report",
    slug: "2023-annual-community-report",
    excerpt: "Complete annual report for 2023 including membership statistics, financial overview, and strategic achievements.",
    content: "This archived report provides a comprehensive overview of our community's performance in 2023. While some information may be outdated, it serves as an important historical record of our achievements and challenges...",
    type: "report",
    category: "announcements",
    status: "archived",
    author: mockAuthors[3],
    tags: [mockTags[8], mockTags[6]],
    featuredImage: "/images/2023-report.jpg",
    publishedAt: new Date("2023-12-31T23:59:59Z"),
    lastModified: new Date("2023-12-30T16:30:00Z"),
    readTime: 30,
    wordCount: 6000,
    difficulty: "intermediate",
    seo: {
      title: "2023 Annual Community Report | Nuvia Archives",
      description: "Complete annual report for 2023 with membership statistics and achievements.",
      keywords: ["annual report", "2023", "community statistics", "archived"]
    },
    metrics: {
      views: 3200,
      downloads: 890,
      shares: 156,
      comments: 67,
      likes: 234,
      bookmarks: 189,
      averageReadTime: 22.5,
      bounceRate: 15.2,
      engagementScore: 88
    },
    visibility: "public",
    version: 1,
    language: "en",
    commentsEnabled: false,
    sharingEnabled: true,
    downloadEnabled: true,
    isFeatured: false,
    isPinned: false,
    priority: 0
  }
];

// Mock statistics
const mockStatistics: PublicationStatistics = {
  totalPublications: mockPublications.length,
  publishedPublications: mockPublications.filter(p => p.status === 'published').length,
  draftPublications: mockPublications.filter(p => p.status === 'draft').length,
  scheduledPublications: mockPublications.filter(p => p.status === 'scheduled').length,
  archivedPublications: mockPublications.filter(p => p.status === 'archived').length,
  
  totalViews: mockPublications.reduce((sum, p) => sum + p.metrics.views, 0),
  totalDownloads: mockPublications.reduce((sum, p) => sum + p.metrics.downloads, 0),
  totalShares: mockPublications.reduce((sum, p) => sum + p.metrics.shares, 0),
  totalComments: mockPublications.reduce((sum, p) => sum + p.metrics.comments, 0),
  averageEngagementScore: Math.round(
    mockPublications.reduce((sum, p) => sum + p.metrics.engagementScore, 0) / mockPublications.length
  ),
  
  publicationsByType: PUBLICATION_TYPES.map(type => ({
    type,
    count: mockPublications.filter(p => p.type === type).length,
    views: mockPublications.filter(p => p.type === type).reduce((sum, p) => sum + p.metrics.views, 0),
    engagement: Math.round(
      mockPublications.filter(p => p.type === type).reduce((sum, p) => sum + p.metrics.engagementScore, 0) / 
      Math.max(1, mockPublications.filter(p => p.type === type).length)
    )
  })),
  
  publicationsByCategory: PUBLICATION_CATEGORIES.map(category => ({
    category,
    count: mockPublications.filter(p => p.category === category).length,
    views: mockPublications.filter(p => p.category === category).reduce((sum, p) => sum + p.metrics.views, 0),
    engagement: Math.round(
      mockPublications.filter(p => p.category === category).reduce((sum, p) => sum + p.metrics.engagementScore, 0) / 
      Math.max(1, mockPublications.filter(p => p.category === category).length)
    )
  })),
  
  publicationsByStatus: PUBLICATION_STATUSES.map(status => ({
    status,
    count: mockPublications.filter(p => p.status === status).length
  })),
  
  topPerformingPublications: mockPublications
    .filter(p => p.status === 'published')
    .sort((a, b) => b.metrics.engagementScore - a.metrics.engagementScore)
    .slice(0, 5)
    .map(p => ({
      publicationId: p.id,
      title: p.title,
      author: p.author.name,
      views: p.metrics.views,
      engagementScore: p.metrics.engagementScore,
      type: p.type,
      category: p.category
    })),
  
  recentActivity: [
    {
      id: "activity_1",
      publicationId: "pub_6",
      title: "Best Practices for Virtual Event Management in Hybrid Communities",
      action: "updated",
      author: "Emily Rodriguez",
      timestamp: new Date("2024-11-16T10:30:00Z")
    },
    {
      id: "activity_2",
      publicationId: "pub_9",
      title: "Innovation Framework for Community Growth",
      action: "created",
      author: "Michael Chen",
      timestamp: new Date("2024-11-16T09:45:00Z")
    },
    {
      id: "activity_3",
      publicationId: "pub_8",
      title: "Machine Learning Applications in Member Engagement Analytics",
      action: "created",
      author: "Dr. Sarah Johnson",
      timestamp: new Date("2024-11-15T11:20:00Z")
    },
    {
      id: "activity_4",
      publicationId: "pub_1",
      title: "The Future of Artificial Intelligence in Community Management",
      action: "published",
      author: "Dr. Sarah Johnson",
      timestamp: new Date("2024-11-15T10:00:00Z")
    },
    {
      id: "activity_5",
      publicationId: "pub_7",
      title: "Chapter News: Seattle Chapter Launches New Mentorship Program",
      action: "published",
      author: "Lisa Thompson",
      timestamp: new Date("2024-11-12T16:00:00Z")
    }
  ],
  
  monthlyTrend: [
    {
      month: "November 2024",
      publicationsCreated: 4,
      publicationsPublished: 3,
      totalViews: 5234,
      totalEngagement: 412
    },
    {
      month: "October 2024",
      publicationsCreated: 3,
      publicationsPublished: 2,
      totalViews: 3890,
      totalEngagement: 298
    },
    {
      month: "September 2024",
      publicationsCreated: 2,
      publicationsPublished: 4,
      totalViews: 4567,
      totalEngagement: 387
    },
    {
      month: "August 2024",
      publicationsCreated: 5,
      publicationsPublished: 3,
      totalViews: 5123,
      totalEngagement: 445
    },
    {
      month: "July 2024",
      publicationsCreated: 3,
      publicationsPublished: 4,
      totalViews: 4789,
      totalEngagement: 398
    },
    {
      month: "June 2024",
      publicationsCreated: 4,
      publicationsPublished: 2,
      totalViews: 4234,
      totalEngagement: 356
    }
  ]
};

export { mockPublications, mockStatistics, mockAuthors, mockTags };