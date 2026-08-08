import type { MediaStatus, MediaType, MediaVisibility } from "./base";

export interface MediaStatistics {
  totalMedia: number;
  totalSize: number;
  totalSizeFormatted: string;

  // By type
  mediaByType: Array<{
    type: MediaType;
    count: number;
    size: number;
    sizeFormatted: string;
    percentage: number;
  }>;

  // By status
  mediaByStatus: Array<{
    status: MediaStatus;
    count: number;
    percentage: number;
  }>;

  // By visibility
  mediaByVisibility: Array<{
    visibility: MediaVisibility;
    count: number;
    percentage: number;
  }>;

  // Storage usage
  storageUsage: {
    local: number;
    s3: number;
    cloudinary: number;
    azure: number;
    gcs: number;
  };

  // Usage metrics
  totalViews: number;
  totalDownloads: number;
  totalUsage: number;

  // Recent activity
  recentUploads: Array<{
    id: string;
    title: string;
    type: MediaType;
    size: number;
    uploadedBy: string;
    uploadedAt: Date;
  }>;

  // Top performing media
  topPerforming: Array<{
    id: string;
    title: string;
    type: MediaType;
    views: number;
    downloads: number;
    usage: number;
  }>;

  // Storage trends
  monthlyTrends: Array<{
    month: string;
    uploads: number;
    sizeAdded: number;
    views: number;
    downloads: number;
  }>;
}

export interface MediaFilters {
  search?: string;
  type?: MediaType[];
  status?: MediaStatus[];
  visibility?: MediaVisibility[];
  folderId?: string;
  tags?: string[];
  categories?: string[];
  createdBy?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  sizeRange?: {
    min: number; // in bytes
    max: number; // in bytes
  };
  hasVersions?: boolean;
  isOptimized?: boolean;
  hasWebpVersion?: boolean;
  hasAvifVersion?: boolean;
  sortBy?: "title" | "createdAt" | "updatedAt" | "size" | "views" | "downloads" | "usage" | "type";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}
