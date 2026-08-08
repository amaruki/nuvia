import type { Media, MediaType } from "@/types/media";

import type { MediaUploadRecordDto } from "./types";

function mediaTypeFromContentType(contentType: string): MediaType {
  if (contentType.startsWith("image/")) return "image";
  if (contentType.startsWith("video/")) return "video";
  if (contentType.startsWith("audio/")) return "audio";
  if (contentType === "application/pdf") return "pdf";
  if (contentType.includes("spreadsheet") || contentType.includes("excel")) return "spreadsheet";
  if (contentType.includes("presentation") || contentType.includes("powerpoint")) {
    return "presentation";
  }
  if (contentType === "application/zip") return "archive";
  return "document";
}

export function formatBytes(size: number): string {
  if (size < 1024) return `${size} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let value = size;
  let unit = -1;
  do {
    value /= 1024;
    unit += 1;
  } while (value >= 1024 && unit < units.length - 1);
  return `${value.toFixed(1)} ${units[unit]}`;
}

/** Map an API upload record onto the UI Media shape. */
export function recordToMedia(record: MediaUploadRecordDto): Media {
  const createdAt = new Date(record.uploadedAt);
  return {
    id: record.id,
    title: record.originalName,
    slug: record.filename,
    description: "",
    type: mediaTypeFromContentType(record.contentType),
    status: "ready",
    visibility: "private",
    url: record.url,
    tags: [],
    categories: [],
    metadata: {
      originalName: record.originalName,
      fileName: record.filename,
      fileExtension: record.originalName.split(".").pop() ?? "",
      mimeType: record.contentType,
      size: record.size,
      sizeFormatted: formatBytes(record.size),
      checksum: record.checksum,
    },
    currentVersion: 1,
    versions: [],
    usage: [],
    permissions: [],
    analytics: [],
    storageType: "local",
    storagePath: record.storagePath,
    isOptimized: false,
    createdAt,
    updatedAt: createdAt,
    createdBy: record.uploadedBy,
    isFeatured: false,
    priority: 50,
  };
}
