import { z } from "zod";

import { CATEGORY_TYPES, CATEGORY_STATUSES, CATEGORY_SCOPES } from "@/types/category.types";

export const categoryFormSchema = z.object({
  name: z
    .string()
    .min(1, "Category name is required")
    .max(100, "Name must be less than 100 characters"),
  slug: z.string().optional(),
  description: z.string().max(500, "Description must be less than 500 characters").optional(),
  type: z.enum(CATEGORY_TYPES),
  status: z.enum(CATEGORY_STATUSES),
  scope: z.enum(CATEGORY_SCOPES),
  color: z.string().min(1, "Color is required"),
  icon: z.string().optional(),
  emoji: z.string().max(2, "Emoji must be maximum 2 characters").optional(),
  parentId: z.string().optional(),
  order: z.number().min(0, "Order must be 0 or greater"),
  allowedRoles: z.array(z.string()).optional(),
  allowedChapters: z.array(z.string()).optional(),
  allowedCommittees: z.array(z.string()).optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});
