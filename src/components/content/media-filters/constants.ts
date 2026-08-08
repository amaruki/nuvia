import type { MediaStatus, MediaType, MediaVisibility } from "@/types/media";

export const mediaTypes: MediaType[] = [
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
];

export const mediaStatuses: MediaStatus[] = [
  "uploading",
  "processing",
  "ready",
  "failed",
  "archived",
];

export const mediaVisibilities: MediaVisibility[] = ["public", "private", "restricted", "draft"];

export const commonTags = [
  "featured",
  "banner",
  "thumbnail",
  "document",
  "video",
  "image",
  "audio",
  "presentation",
  "spreadsheet",
];
