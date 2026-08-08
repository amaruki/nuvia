import { z } from "zod";

import { dateSchema } from "./shared";

// Filter validation
export const mediaFiltersSchema = z.object({
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

// Type exports for inference
export type MediaFilters = z.infer<typeof mediaFiltersSchema>;
