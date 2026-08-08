import * as z from "zod";
import {
  ARTICLE_TYPES,
  ARTICLE_CATEGORIES,
  ARTICLE_STATUSES,
  ARTICLE_DIFFICULTIES,
  ARTICLE_FORMATS,
} from "@/types/article";

// Form schema for articles
export const formSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title must be less than 200 characters"),
  slug: z.string().optional(),
  excerpt: z
    .string()
    .min(10, "Excerpt must be at least 10 characters")
    .max(500, "Excerpt must be less than 500 characters"),
  content: z.string().min(50, "Content must be at least 50 characters"),
  type: z.enum(ARTICLE_TYPES),
  category: z.enum(ARTICLE_CATEGORIES),
  format: z.enum(ARTICLE_FORMATS),
  difficulty: z.enum(ARTICLE_DIFFICULTIES),
  status: z.enum(ARTICLE_STATUSES),
  authorId: z.string().min(1, "Author is required"),
  coAuthorIds: z.array(z.string()).optional(),
  reviewerId: z.string().optional(),
  tagIds: z.array(z.string()).default([]),
  seriesId: z.string().optional(),
  visibility: z.enum(["public", "members_only", "premium_only", "chapter_only", "committee_only"]),
  commentsEnabled: z.boolean(),
  sharingEnabled: z.boolean(),
  downloadEnabled: z.boolean(),
  isFeatured: z.boolean(),
  isPinned: z.boolean(),
  priority: z.number().min(0).max(10),
  seo: z.object({
    title: z
      .string()
      .min(1, "SEO title is required")
      .max(60, "SEO title must be less than 60 characters"),
    description: z
      .string()
      .min(1, "SEO description is required")
      .max(160, "SEO description must be less than 160 characters"),
    keywords: z.array(z.string()).default([]),
    ogImage: z.string().optional(),
  }),
});
