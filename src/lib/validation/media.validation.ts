import { z } from "zod";
import {
  MediaType,
  MediaStatus,
  MediaVisibility,
  MediaStorageType,
  MediaCompressionLevel,
} from "@/types/media.types";

// Base validation schemas
const uuidSchema = z.string().uuid("Invalid ID format");
const urlSchema = z.string().url("Invalid URL format");
const emailSchema = z.string().email("Invalid email format");
const dateSchema = z.date();

// Media metadata validation
const mediaMetadataSchema = z.object({
  originalName: z.string().min(1, "Original name is required").max(255, "Original name too long"),
  fileName: z.string().min(1, "File name is required").max(255, "File name too long"),
  fileExtension: z.string().min(1, "File extension is required").max(10, "File extension too long"),
  mimeType: z.string().min(1, "MIME type is required").max(100, "MIME type too long"),
  size: z
    .number()
    .min(0, "File size must be positive")
    .max(5 * 1024 * 1024 * 1024, "File size too large (max 5GB)"),
  sizeFormatted: z.string().min(1, "Formatted size is required"),
  dimensions: z
    .object({
      width: z.number().min(1, "Width must be positive"),
      height: z.number().min(1, "Height must be positive"),
      aspectRatio: z.number().min(0, "Aspect ratio must be positive"),
    })
    .optional(),
  duration: z.number().min(0, "Duration must be positive").optional(),
  fps: z.number().min(0, "FPS must be positive").max(120, "FPS too high").optional(),
  bitrate: z.number().min(0, "Bitrate must be positive").optional(),
  colorSpace: z.string().max(50, "Color space too long").optional(),
  hasTransparency: z.boolean().optional(),
  dominantColor: z.string().max(20, "Dominant color too long").optional(),
  colorPalette: z.array(z.string().max(20, "Color too long")).max(10, "Too many colors").optional(),
  exif: z
    .object({
      camera: z.string().max(100, "Camera name too long").optional(),
      lens: z.string().max(100, "Lens name too long").optional(),
      focalLength: z.string().max(20, "Focal length too long").optional(),
      aperture: z.string().max(10, "Aperture too long").optional(),
      shutterSpeed: z.string().max(20, "Shutter speed too long").optional(),
      iso: z.number().min(0, "ISO must be positive").max(102400, "ISO too high").optional(),
      flash: z.boolean().optional(),
      gps: z
        .object({
          latitude: z.number().min(-90, "Invalid latitude").max(90, "Invalid latitude"),
          longitude: z.number().min(-180, "Invalid longitude").max(180, "Invalid longitude"),
        })
        .optional(),
      dateTaken: dateSchema.optional(),
    })
    .optional(),
  pageCount: z
    .number()
    .min(1, "Page count must be positive")
    .max(10000, "Page count too high")
    .optional(),
  wordCount: z
    .number()
    .min(0, "Word count must be non-negative")
    .max(1000000, "Word count too high")
    .optional(),
  author: z.string().max(255, "Author name too long").optional(),
  subject: z.string().max(255, "Subject too long").optional(),
  checksum: z.string().min(1, "Checksum is required").max(128, "Checksum too long"),
  encoding: z.string().max(50, "Encoding too long").optional(),
  customFields: z.record(z.string(), z.any()).optional(),
});

// Media version validation
const mediaVersionSchema = z.object({
  id: uuidSchema,
  version: z.number().min(1, "Version must be positive").max(1000, "Version too high"),
  mediaId: uuidSchema,
  url: urlSchema,
  thumbnailUrl: urlSchema.optional(),
  metadata: mediaMetadataSchema,
  createdAt: dateSchema,
  createdBy: z.string().min(1, "Creator is required").max(255, "Creator name too long"),
  changelog: z.string().max(1000, "Changelog too long").optional(),
  isActive: z.boolean(),
  size: z.number().min(0, "Size must be positive"),
  compressionLevel: z.enum(["none", "low", "medium", "high", "maximum"]).optional(),
});

// Media usage validation
const mediaUsageSchema = z.object({
  id: uuidSchema,
  mediaId: uuidSchema,
  entityType: z.enum([
    "article",
    "announcement",
    "publication",
    "event",
    "user_profile",
    "chapter",
    "committee",
  ]),
  entityId: uuidSchema,
  entityTitle: z.string().min(1, "Entity title is required").max(255, "Entity title too long"),
  usageType: z.enum(["featured_image", "gallery", "attachment", "avatar", "banner", "thumbnail"]),
  url: urlSchema,
  addedAt: dateSchema,
  addedBy: z.string().min(1, "Added by is required").max(255, "Added by name too long"),
});

// Media permission validation
const mediaPermissionSchema = z.object({
  id: uuidSchema,
  mediaId: uuidSchema,
  entityType: z.enum(["user", "role", "chapter", "committee"]),
  entityId: uuidSchema,
  entityName: z.string().min(1, "Entity name is required").max(255, "Entity name too long"),
  permissions: z
    .array(z.enum(["view", "download", "edit", "delete", "share"]))
    .min(1, "At least one permission required"),
  grantedBy: z.string().min(1, "Granted by is required").max(255, "Granted by name too long"),
  grantedAt: dateSchema,
  expiresAt: dateSchema.optional(),
});

// Media folder validation
const mediaFolderSchema = z.object({
  id: uuidSchema,
  name: z.string().min(1, "Folder name is required").max(255, "Folder name too long"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(255, "Slug too long")
    .regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
  description: z.string().max(1000, "Description too long").optional(),
  parentId: uuidSchema.nullable().optional(),
  path: z.string().min(1, "Path is required").max(1000, "Path too long"),
  level: z.number().min(0, "Level must be non-negative").max(10, "Level too deep"),
  order: z.number().min(0, "Order must be non-negative").max(10000, "Order too high"),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format")
    .optional(),
  icon: z.string().max(50, "Icon name too long").optional(),
  visibility: z.enum(["public", "private", "restricted", "draft"]),
  allowedRoles: z.array(z.string()).optional(),
  allowedChapters: z.array(z.string()).optional(),
  allowedCommittees: z.array(z.string()).optional(),
  mediaCount: z.number().min(0, "Media count must be non-negative"),
  totalSize: z.number().min(0, "Total size must be non-negative"),
  lastModified: dateSchema,
  createdAt: dateSchema,
  updatedAt: dateSchema,
  createdBy: z.string().min(1, "Creator is required").max(255, "Creator name too long"),
  updatedBy: z.string().max(255, "Updated by name too long").optional(),
});

// Media tag validation
const mediaTagSchema = z.object({
  id: uuidSchema,
  name: z.string().min(1, "Tag name is required").max(50, "Tag name too long"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(50, "Slug too long")
    .regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format"),
  description: z.string().max(500, "Description too long").optional(),
  count: z.number().min(0, "Count must be non-negative"),
  createdAt: dateSchema,
  createdBy: z.string().min(1, "Creator is required").max(255, "Creator name too long"),
});

// Main media validation
const mediaSchema = z.object({
  id: uuidSchema,
  title: z.string().min(1, "Title is required").max(255, "Title too long"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(255, "Slug too long")
    .regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
  description: z.string().max(2000, "Description too long").optional(),
  altText: z.string().max(255, "Alt text too long").optional(),
  caption: z.string().max(500, "Caption too long").optional(),
  type: z.enum([
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
  ]),
  status: z.enum(["uploading", "processing", "ready", "failed", "archived"]),
  visibility: z.enum(["public", "private", "restricted", "draft"]),
  url: urlSchema,
  thumbnailUrl: urlSchema.optional(),
  previewUrl: urlSchema.optional(),
  folderId: uuidSchema.nullable().optional(),
  folderPath: z.string().max(1000, "Folder path too long").optional(),
  tags: z.array(mediaTagSchema),
  categories: z.array(z.string().max(50, "Category name too long")),
  metadata: mediaMetadataSchema,
  currentVersion: z.number().min(1, "Current version must be positive"),
  versions: z.array(mediaVersionSchema),
  usage: z.array(mediaUsageSchema),
  permissions: z.array(mediaPermissionSchema),
  analytics: z.array(z.any()), // Analytics has complex structure, using any for now
  processingStartedAt: dateSchema.optional(),
  processingCompletedAt: dateSchema.optional(),
  processingError: z.string().max(1000, "Processing error too long").optional(),
  storageType: z.enum(["local", "s3", "cloudinary", "azure", "gcs"]),
  storagePath: z.string().min(1, "Storage path is required").max(1000, "Storage path too long"),
  cdnUrl: urlSchema.optional(),
  isOptimized: z.boolean(),
  compressionLevel: z.enum(["none", "low", "medium", "high", "maximum"]).optional(),
  hasWebpVersion: z.boolean(),
  hasAvifVersion: z.boolean(),
  allowedRoles: z.array(z.string()).optional(),
  allowedChapters: z.array(z.string()).optional(),
  allowedCommittees: z.array(z.string()).optional(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
  createdBy: z.string().min(1, "Creator is required").max(255, "Creator name too long"),
  updatedBy: z.string().max(255, "Updated by name too long").optional(),
  deletedAt: dateSchema.optional(),
  isFeatured: z.boolean(),
  priority: z.number().min(0, "Priority must be non-negative").max(100, "Priority too high"),
  customFields: z.record(z.string(), z.any()).optional(),
});

// Form data validation schemas
const createMediaDataSchema = z.object({
  title: z.string().min(1, "Title is required").max(255, "Title too long"),
  description: z.string().max(2000, "Description too long").optional(),
  altText: z.string().max(255, "Alt text too long").optional(),
  type: z.enum([
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
  ]),
  visibility: z.enum(["public", "private", "restricted", "draft"]).optional(),
  url: urlSchema.optional(),
  thumbnailUrl: urlSchema.optional(),
  previewUrl: urlSchema.optional(),
  folderId: z.string().uuid().nullable().optional(),
  tags: z.array(z.string().max(50, "Tag name too long")).optional(),
  size: z.number().min(0, "Size must be positive").optional(),
  width: z.number().min(1, "Width must be positive").optional(),
  height: z.number().min(1, "Height must be positive").optional(),
  duration: z.number().min(0, "Duration must be positive").optional(),
  format: z.string().max(20, "Format too long").optional(),
  mimeType: z.string().max(100, "MIME type too long").optional(),
  dimensions: z.string().max(50, "Dimensions too long").optional(),
  colorSpace: z.string().max(50, "Color space too long").optional(),
  quality: z.string().max(20, "Quality too long").optional(),
  compression: z.string().max(20, "Compression too long").optional(),
  exif: z.record(z.string(), z.any()).optional(),
  custom: z.record(z.string(), z.any()).optional(),
  uploadedBy: z.string().max(255, "Uploaded by name too long").optional(),
});

const updateMediaDataSchema = z.object({
  title: z.string().min(1, "Title is required").max(255, "Title too long").optional(),
  description: z.string().max(2000, "Description too long").optional(),
  altText: z.string().max(255, "Alt text too long").optional(),
  visibility: z.enum(["public", "private", "restricted", "draft"]).optional(),
  url: urlSchema.optional(),
  thumbnailUrl: urlSchema.optional(),
  previewUrl: urlSchema.optional(),
  folderId: z.string().uuid().nullable().optional(),
  tags: z.array(z.string().max(50, "Tag name too long")).optional(),
  metadata: mediaMetadataSchema.partial().optional(),
});

const mediaFormDataSchema = z.object({
  title: z.string().min(1, "Title is required").max(255, "Title too long"),
  slug: z
    .string()
    .max(255, "Slug too long")
    .regex(/^[a-z0-9-]*$/, "Slug must contain only lowercase letters, numbers, and hyphens")
    .optional(),
  description: z.string().max(2000, "Description too long").optional(),
  altText: z.string().max(255, "Alt text too long").optional(),
  caption: z.string().max(500, "Caption too long").optional(),
  folderId: z.string().uuid().nullable().optional(),
  tags: z.array(z.string().max(50, "Tag name too long")),
  categories: z.array(z.string().max(50, "Category name too long")),
  visibility: z.enum(["public", "private", "restricted", "draft"]),
  allowedRoles: z.array(z.string()).optional(),
  allowedChapters: z.array(z.string()).optional(),
  allowedCommittees: z.array(z.string()).optional(),
  isFeatured: z.boolean(),
  priority: z.number().min(0, "Priority must be non-negative").max(100, "Priority too high"),
  customFields: z.record(z.string(), z.any()).optional(),
});

const mediaUploadOptionsSchema = z.object({
  folderId: z.string().uuid().optional(),
  tags: z.array(z.string().max(50, "Tag name too long")).optional(),
  categories: z.array(z.string().max(50, "Category name too long")).optional(),
  visibility: z.enum(["public", "private", "restricted", "draft"]).optional(),
  allowedRoles: z.array(z.string()).optional(),
  allowedChapters: z.array(z.string()).optional(),
  allowedCommittees: z.array(z.string()).optional(),
  isOptimized: z.boolean().optional(),
  compressionLevel: z.enum(["none", "low", "medium", "high", "maximum"]).optional(),
  generateWebp: z.boolean().optional(),
  generateAvif: z.boolean().optional(),
  generateThumbnail: z.boolean().optional(),
  generatePreview: z.boolean().optional(),
  extractMetadata: z.boolean().optional(),
  autoTag: z.boolean().optional(),
  customFields: z.record(z.string(), z.any()).optional(),
});

const createFolderDataSchema = z.object({
  name: z.string().min(1, "Folder name is required").max(255, "Folder name too long"),
  description: z.string().max(1000, "Description too long").optional(),
  parentId: z.string().uuid().nullable().optional(),
  visibility: z.enum(["public", "private", "restricted", "draft"]).optional(),
  permissions: z.array(z.string()).optional(),
  createdBy: z.string().max(255, "Created by name too long").optional(),
});

const updateFolderDataSchema = z.object({
  name: z.string().min(1, "Folder name is required").max(255, "Folder name too long").optional(),
  description: z.string().max(1000, "Description too long").optional(),
  visibility: z.enum(["public", "private", "restricted", "draft"]).optional(),
  permissions: z.array(z.string()).optional(),
});

// Filter validation
const mediaFiltersSchema = z.object({
  search: z.string().max(500, "Search term too long").optional(),
  type: z
    .array(
      z.enum([
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
      ]),
    )
    .optional(),
  status: z.array(z.enum(["uploading", "processing", "ready", "failed", "archived"])).optional(),
  visibility: z.array(z.enum(["public", "private", "restricted", "draft"])).optional(),
  folderId: z.string().uuid().optional(),
  tags: z.array(z.string()).optional(),
  categories: z.array(z.string()).optional(),
  createdBy: z.array(z.string()).optional(),
  dateRange: z
    .object({
      start: dateSchema,
      end: dateSchema,
    })
    .optional(),
  sizeRange: z
    .object({
      min: z.number().min(0, "Minimum size must be non-negative"),
      max: z.number().min(0, "Maximum size must be non-negative"),
    })
    .optional(),
  hasVersions: z.boolean().optional(),
  isOptimized: z.boolean().optional(),
  hasWebpVersion: z.boolean().optional(),
  hasAvifVersion: z.boolean().optional(),
  sortBy: z
    .enum(["title", "createdAt", "updatedAt", "size", "views", "downloads", "usage", "type"])
    .optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
  page: z.number().min(1, "Page must be positive").optional(),
  limit: z.number().min(1, "Limit must be positive").max(100, "Limit too high").optional(),
});

// Export all schemas
export {
  // Base schemas
  uuidSchema,
  urlSchema,
  emailSchema,
  dateSchema,

  // Entity schemas
  mediaMetadataSchema,
  mediaVersionSchema,
  mediaUsageSchema,
  mediaPermissionSchema,
  mediaFolderSchema,
  mediaTagSchema,
  mediaSchema,

  // Form schemas
  createMediaDataSchema,
  updateMediaDataSchema,
  mediaFormDataSchema,
  mediaUploadOptionsSchema,
  createFolderDataSchema,
  updateFolderDataSchema,
  mediaFiltersSchema,
};

// Type exports for inference
export type CreateMediaData = z.infer<typeof createMediaDataSchema>;
export type UpdateMediaData = z.infer<typeof updateMediaDataSchema>;
export type MediaFormData = z.infer<typeof mediaFormDataSchema>;
export type MediaUploadOptions = z.infer<typeof mediaUploadOptionsSchema>;
export type CreateFolderData = z.infer<typeof createFolderDataSchema>;
export type UpdateFolderData = z.infer<typeof updateFolderDataSchema>;
export type MediaFilters = z.infer<typeof mediaFiltersSchema>;

// Validation functions
export const validateCreateMediaData = (data: unknown) => createMediaDataSchema.safeParse(data);
export const validateUpdateMediaData = (data: unknown) => updateMediaDataSchema.safeParse(data);
export const validateMediaFormData = (data: unknown) => mediaFormDataSchema.safeParse(data);
export const validateMediaUploadOptions = (data: unknown) =>
  mediaUploadOptionsSchema.safeParse(data);
export const validateCreateFolderData = (data: unknown) => createFolderDataSchema.safeParse(data);
export const validateUpdateFolderData = (data: unknown) => updateFolderDataSchema.safeParse(data);
export const validateMediaFilters = (data: unknown) => mediaFiltersSchema.safeParse(data);
export const validateMedia = (data: unknown) => mediaSchema.safeParse(data);
export const validateMediaFolder = (data: unknown) => mediaFolderSchema.safeParse(data);
export const validateMediaTag = (data: unknown) => mediaTagSchema.safeParse(data);
