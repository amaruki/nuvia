import type {
  MediaCompressionLevel,
  MediaStatus,
  MediaStorageType,
  MediaType,
  MediaVisibility,
} from "./base";

// Export type constants for re-use

export const MEDIA_TYPES: MediaType[] = [
  "image",
  "video",
  "audio",
  "document",
  "archive",
  "spreadsheet",
  "presentation",
  "pdf",
  "vector",
  "font",
] as const;

export const MEDIA_STATUSES: MediaStatus[] = [
  "uploading",
  "processing",
  "ready",
  "failed",
  "archived",
] as const;

export const MEDIA_VISIBILITY: MediaVisibility[] = [
  "public",
  "private",
  "restricted",
  "draft",
] as const;

export const MEDIA_STORAGE_TYPES: MediaStorageType[] = [
  "local",
  "s3",
  "cloudinary",
  "azure",
  "gcs",
] as const;

export const MEDIA_COMPRESSION_LEVELS: MediaCompressionLevel[] = [
  "none",
  "low",
  "medium",
  "high",
  "maximum",
] as const;
