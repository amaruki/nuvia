import { z } from "zod";

import { mediaMetadataSchema } from "./entity.schemas";
import { urlSchema } from "./shared";

// Form data validation schemas
export const createMediaDataSchema = z.object({
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

export const updateMediaDataSchema = z.object({
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

export const mediaFormDataSchema = z.object({
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

export const mediaUploadOptionsSchema = z.object({
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

export const createFolderDataSchema = z.object({
  name: z.string().min(1, "Folder name is required").max(255, "Folder name too long"),
  description: z.string().max(1000, "Description too long").optional(),
  parentId: z.string().uuid().nullable().optional(),
  visibility: z.enum(["public", "private", "restricted", "draft"]).optional(),
  permissions: z.array(z.string()).optional(),
  createdBy: z.string().max(255, "Created by name too long").optional(),
});

export const updateFolderDataSchema = z.object({
  name: z.string().min(1, "Folder name is required").max(255, "Folder name too long").optional(),
  description: z.string().max(1000, "Description too long").optional(),
  visibility: z.enum(["public", "private", "restricted", "draft"]).optional(),
  permissions: z.array(z.string()).optional(),
});

// Type exports for inference
export type CreateMediaData = z.infer<typeof createMediaDataSchema>;
export type UpdateMediaData = z.infer<typeof updateMediaDataSchema>;
export type MediaFormData = z.infer<typeof mediaFormDataSchema>;
export type MediaUploadOptions = z.infer<typeof mediaUploadOptionsSchema>;
export type CreateFolderData = z.infer<typeof createFolderDataSchema>;
export type UpdateFolderData = z.infer<typeof updateFolderDataSchema>;
