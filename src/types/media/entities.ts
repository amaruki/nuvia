import type { MediaCompressionLevel, MediaMetadata, MediaVisibility } from "./base";

export interface MediaVersion {
  id: string;
  version: number;
  mediaId: string;
  url: string;
  thumbnailUrl?: string;
  metadata: MediaMetadata;
  createdAt: Date;
  createdBy: string;
  changelog?: string;
  isActive: boolean;
  size: number;
  compressionLevel?: MediaCompressionLevel;
}

export interface MediaUsage {
  id: string;
  mediaId: string;
  entityType:
    | "article"
    | "announcement"
    | "publication"
    | "event"
    | "user_profile"
    | "chapter"
    | "committee";
  entityId: string;
  entityTitle: string;
  usageType: "featured_image" | "gallery" | "attachment" | "avatar" | "banner" | "thumbnail";
  url: string;
  addedAt: Date;
  addedBy: string;
}

export interface MediaPermission {
  id: string;
  mediaId: string;
  entityType: "user" | "role" | "chapter" | "committee";
  entityId: string;
  entityName: string;
  permissions: ("view" | "download" | "edit" | "delete" | "share")[];
  grantedBy: string;
  grantedAt: Date;
  expiresAt?: Date;
}

export interface MediaAnalytics {
  id: string;
  mediaId: string;
  date: Date;

  // View metrics
  views: number;
  uniqueViews: number;
  avgViewDuration: number; // in seconds

  // Download metrics
  downloads: number;
  uniqueDownloads: number;

  // Usage metrics
  usageCount: number; // how many times used in content
  shares: number;

  // Performance metrics
  loadTime: number; // average load time in ms
  errorRate: number; // percentage

  // Geographic data
  topCountries: Array<{
    country: string;
    views: number;
    percentage: number;
  }>;

  // Referrer data
  topReferrers: Array<{
    source: string;
    views: number;
    percentage: number;
  }>;
}

export interface MediaFolder {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string; // For nested folders
  path: string; // Full path from root
  level: number; // Depth in folder hierarchy

  // Organization
  order: number; // Sort order
  color?: string;
  icon?: string;

  // Access control
  visibility: MediaVisibility;
  allowedRoles?: string[];
  allowedChapters?: string[];
  allowedCommittees?: string[];

  // Content tracking
  mediaCount: number;
  totalSize: number;
  lastModified: Date;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy?: string;
}

export interface MediaTag {
  id: string;
  name: string;
  slug: string;
  color: string;
  description?: string;
  count: number; // How many media items use this tag
  createdAt: Date;
  createdBy: string;
}
