import type { MediaCompressionLevel, MediaVisibility } from "./base";

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
