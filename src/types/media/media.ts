import type {
  MediaAnalytics,
  MediaPermission,
  MediaTag,
  MediaUsage,
  MediaVersion,
} from "./entities";
import type {
  MediaCompressionLevel,
  MediaMetadata,
  MediaStatus,
  MediaStorageType,
  MediaType,
  MediaVisibility,
} from "./base";

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
