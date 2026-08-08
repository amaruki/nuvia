// Media management types for Nuvia community platform

export type MediaType =
  | "image"
  | "video"
  | "audio"
  | "document"
  | "archive"
  | "spreadsheet"
  | "presentation"
  | "pdf"
  | "vector"
  | "font";

export type MediaStatus = "uploading" | "processing" | "ready" | "failed" | "archived";

export type MediaVisibility = "public" | "private" | "restricted" | "draft";

export type MediaStorageType = "local" | "s3" | "cloudinary" | "azure" | "gcs";

export type MediaCompressionLevel = "none" | "low" | "medium" | "high" | "maximum";

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
