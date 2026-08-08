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
