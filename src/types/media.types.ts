// Media management types for Nuvia community platform

export type MediaType = 
  | 'image'
  | 'video'
  | 'audio'
  | 'document'
  | 'archive'
  | 'spreadsheet'
  | 'presentation'
  | 'pdf'
  | 'vector'
  | 'font';

export type MediaStatus = 'uploading' | 'processing' | 'ready' | 'failed' | 'archived';

export type MediaVisibility = 'public' | 'private' | 'restricted' | 'draft';

export type MediaStorageType = 'local' | 's3' | 'cloudinary' | 'azure' | 'gcs';

export type MediaCompressionLevel = 'none' | 'low' | 'medium' | 'high' | 'maximum';

export interface MediaDimensions {
  width: number;
  height: number;
  aspectRatio: number;
}

export interface MediaMetadata {
  // Basic file information
  originalName: string;
  fileName: string;
  fileExtension: string;
  mimeType: string;
  size: number; // in bytes
  sizeFormatted: string;
  
  // Image/Video specific
  dimensions?: MediaDimensions;
  duration?: number; // in seconds for video/audio
  fps?: number; // for video
  bitrate?: number; // for video/audio
  
  // Color information for images
  colorSpace?: string;
  hasTransparency?: boolean;
  dominantColor?: string;
  colorPalette?: string[];
  
  // EXIF data for images
  exif?: {
    camera?: string;
    lens?: string;
    focalLength?: string;
    aperture?: string;
    shutterSpeed?: string;
    iso?: number;
    flash?: boolean;
    gps?: {
      latitude: number;
      longitude: number;
    };
    dateTaken?: Date;
  };
  
  // Document specific
  pageCount?: number;
  wordCount?: number;
  author?: string;
  subject?: string;
  
  // Technical details
  checksum: string;
  encoding?: string;
  
  // Custom metadata
  customFields?: Record<string, any>;
}

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
  entityType: 'article' | 'announcement' | 'publication' | 'event' | 'user_profile' | 'chapter' | 'committee';
  entityId: string;
  entityTitle: string;
  usageType: 'featured_image' | 'gallery' | 'attachment' | 'avatar' | 'banner' | 'thumbnail';
  url: string;
  addedAt: Date;
  addedBy: string;
}

export interface MediaPermission {
  id: string;
  mediaId: string;
  entityType: 'user' | 'role' | 'chapter' | 'committee';
  entityId: string;
  entityName: string;
  permissions: ('view' | 'download' | 'edit' | 'delete' | 'share')[];
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

export interface Media {
  id: string;
  title: string;
  slug: string;
  description?: string;
  altText?: string; // For accessibility
  caption?: string;
  
  // File information
  type: MediaType;
  status: MediaStatus;
  visibility: MediaVisibility;
  url: string;
  thumbnailUrl?: string;
  previewUrl?: string; // For documents/videos
  
  // Organization
  folderId?: string;
  folderPath?: string;
  tags: MediaTag[];
  categories: string[]; // Simple string categories
  
  // Metadata
  metadata: MediaMetadata;
  
  // Version control
  currentVersion: number;
  versions: MediaVersion[];
  
  // Usage tracking
  usage: MediaUsage[];
  
  // Permissions
  permissions: MediaPermission[];
  
  // Analytics
  analytics: MediaAnalytics[];
  
  // Processing information
  processingStartedAt?: Date;
  processingCompletedAt?: Date;
  processingError?: string;
  
  // Storage information
  storageType: MediaStorageType;
  storagePath: string;
  cdnUrl?: string;
  
  // Optimization
  isOptimized: boolean;
  compressionLevel?: MediaCompressionLevel;
  hasWebpVersion?: boolean;
  hasAvifVersion?: boolean;
  
  // Access control
  allowedRoles?: string[];
  allowedChapters?: string[];
  allowedCommittees?: string[];
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy?: string;
  deletedAt?: Date;
  
  // Featured and priority
  isFeatured: boolean;
  priority: number;
  
  // Additional properties
  customFields?: Record<string, any>;
}

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
  sortBy?: 'title' | 'createdAt' | 'updatedAt' | 'size' | 'views' | 'downloads' | 'usage' | 'type';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface MediaFormData {
  title: string;
  slug?: string;
  description?: string;
  altText?: string;
  caption?: string;
  folderId?: string;
  tags: string[];
  categories: string[];
  visibility: MediaVisibility;
  allowedRoles?: string[];
  allowedChapters?: string[];
  allowedCommittees?: string[];
  isFeatured: boolean;
  priority: number;
  customFields?: Record<string, any>;
}

export interface MediaUploadOptions {
  folderId?: string;
  tags?: string[];
  categories?: string[];
  visibility?: MediaVisibility;
  allowedRoles?: string[];
  allowedChapters?: string[];
  allowedCommittees?: string[];
  isOptimized?: boolean;
  compressionLevel?: MediaCompressionLevel;
  generateWebp?: boolean;
  generateAvif?: boolean;
  generateThumbnail?: boolean;
  generatePreview?: boolean;
  extractMetadata?: boolean;
  autoTag?: boolean;
  customFields?: Record<string, any>;
}

// Export type constants for re-use
export const MEDIA_TYPES: MediaType[] = [
  'image', 'video', 'audio', 'document', 'archive', 
  'spreadsheet', 'presentation', 'pdf', 'vector', 'font'
] as const;

export const MEDIA_STATUSES: MediaStatus[] = [
  'uploading', 'processing', 'ready', 'failed', 'archived'
] as const;

export const MEDIA_VISIBILITY: MediaVisibility[] = [
  'public', 'private', 'restricted', 'draft'
] as const;

export const MEDIA_STORAGE_TYPES: MediaStorageType[] = [
  'local', 's3', 'cloudinary', 'azure', 'gcs'
] as const;

export const MEDIA_COMPRESSION_LEVELS: MediaCompressionLevel[] = [
  'none', 'low', 'medium', 'high', 'maximum'
] as const;

// Display information
export const MEDIA_TYPE_DISPLAY: Record<MediaType, {
  name: string;
  description: string;
  icon: string;
  color: string;
  extensions: string[];
  maxSize: number; // in MB
}> = {
  image: {
    name: 'Image',
    description: 'Image files including photos, graphics, and illustrations',
    icon: 'image',
    color: 'blue',
    extensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.tiff'],
    maxSize: 50
  },
  video: {
    name: 'Video',
    description: 'Video files for multimedia content',
    icon: 'video',
    color: 'purple',
    extensions: ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv'],
    maxSize: 500
  },
  audio: {
    name: 'Audio',
    description: 'Audio files for podcasts and music',
    icon: 'music',
    color: 'green',
    extensions: ['.mp3', '.wav', '.ogg', '.flac', '.aac', '.m4a'],
    maxSize: 100
  },
  document: {
    name: 'Document',
    description: 'Text documents and PDFs',
    icon: 'file-text',
    color: 'red',
    extensions: ['.doc', '.docx', '.txt', '.rtf', '.odt'],
    maxSize: 25
  },
  archive: {
    name: 'Archive',
    description: 'Compressed files and archives',
    icon: 'archive',
    color: 'orange',
    extensions: ['.zip', '.rar', '.7z', '.tar', '.gz'],
    maxSize: 100
  },
  spreadsheet: {
    name: 'Spreadsheet',
    description: 'Excel and spreadsheet files',
    icon: 'grid',
    color: 'emerald',
    extensions: ['.xls', '.xlsx', '.csv', '.ods'],
    maxSize: 25
  },
  presentation: {
    name: 'Presentation',
    description: 'PowerPoint and presentation files',
    icon: 'presentation',
    color: 'indigo',
    extensions: ['.ppt', '.pptx', '.odp'],
    maxSize: 50
  },
  pdf: {
    name: 'PDF',
    description: 'PDF documents and forms',
    icon: 'file-text',
    color: 'red',
    extensions: ['.pdf'],
    maxSize: 50
  },
  vector: {
    name: 'Vector',
    description: 'Vector graphics and illustrations',
    icon: 'pen-tool',
    color: 'pink',
    extensions: ['.svg', '.ai', '.eps', '.svgz'],
    maxSize: 25
  },
  font: {
    name: 'Font',
    description: 'Font files for typography',
    icon: 'type',
    color: 'cyan',
    extensions: ['.ttf', '.otf', '.woff', '.woff2', '.eot'],
    maxSize: 10
  }
};

export const MEDIA_STATUS_DISPLAY: Record<MediaStatus, {
  name: string;
  description: string;
  icon: string;
  color: string;
  badgeVariant: 'default' | 'secondary' | 'destructive' | 'outline';
}> = {
  uploading: {
    name: 'Uploading',
    description: 'File is currently being uploaded',
    icon: 'upload',
    color: 'blue',
    badgeVariant: 'outline'
  },
  processing: {
    name: 'Processing',
    description: 'File is being processed and optimized',
    icon: 'loader',
    color: 'amber',
    badgeVariant: 'outline'
  },
  ready: {
    name: 'Ready',
    description: 'File is ready for use',
    icon: 'check-circle',
    color: 'emerald',
    badgeVariant: 'default'
  },
  failed: {
    name: 'Failed',
    description: 'File upload or processing failed',
    icon: 'x-circle',
    color: 'red',
    badgeVariant: 'destructive'
  },
  archived: {
    name: 'Archived',
    description: 'File is archived and not actively used',
    icon: 'archive',
    color: 'slate',
    badgeVariant: 'secondary'
  }
};

export const MEDIA_VISIBILITY_DISPLAY: Record<MediaVisibility, {
  name: string;
  description: string;
  icon: string;
  color: string;
}> = {
  public: {
    name: 'Public',
    description: 'Visible to everyone',
    icon: 'globe',
    color: 'blue'
  },
  private: {
    name: 'Private',
    description: 'Only visible to you',
    icon: 'lock',
    color: 'red'
  },
  restricted: {
    name: 'Restricted',
    description: 'Visible to specific users/roles',
    icon: 'users',
    color: 'amber'
  },
  draft: {
    name: 'Draft',
    description: 'Not published, only visible to editors',
    icon: 'eye-off',
    color: 'slate'
  }
};

// Additional interfaces for service operations
export interface CreateMediaData {
  title: string;
  description?: string;
  altText?: string;
  type: MediaType;
  visibility?: MediaVisibility;
  url?: string;
  thumbnailUrl?: string;
  previewUrl?: string;
  folderId?: string | null;
  tags?: string[];
  size?: number;
  width?: number;
  height?: number;
  duration?: number;
  format?: string;
  mimeType?: string;
  dimensions?: string;
  colorSpace?: string;
  quality?: string;
  compression?: string;
  exif?: Record<string, any>;
  custom?: Record<string, any>;
  uploadedBy?: string;
}

export interface UpdateMediaData {
  title?: string;
  description?: string;
  altText?: string;
  visibility?: MediaVisibility;
  url?: string;
  thumbnailUrl?: string;
  previewUrl?: string;
  folderId?: string | null;
  tags?: string[];
  metadata?: Partial<MediaMetadata>;
}

export interface CreateFolderData {
  name: string;
  description?: string;
  parentId?: string | null;
  visibility?: MediaVisibility;
  permissions?: string[];
  createdBy?: string;
}

export interface UpdateFolderData {
  name?: string;
  description?: string;
  visibility?: MediaVisibility;
  permissions?: string[];
}
