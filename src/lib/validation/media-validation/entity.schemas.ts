import { z } from "zod";

import { dateSchema, urlSchema, uuidSchema } from "./shared";

// Media metadata validation
export const mediaMetadataSchema = z.object({
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
export const mediaVersionSchema = z.object({
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
export const mediaUsageSchema = z.object({
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
export const mediaPermissionSchema = z.object({
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
export const mediaFolderSchema = z.object({
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
export const mediaTagSchema = z.object({
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
export const mediaSchema = z.object({
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
