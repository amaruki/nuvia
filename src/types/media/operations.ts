import type { MediaMetadata, MediaType, MediaVisibility } from "./base";

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
