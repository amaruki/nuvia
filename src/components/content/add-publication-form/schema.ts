import * as z from "zod";
import {
  PUBLICATION_TYPES,
  PUBLICATION_CATEGORIES,
  PUBLICATION_STATUSES,
} from "@/types/publication.types";

// Form schema for publications
export const publicationFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title must be less than 200 characters"),
  slug: z.string().optional(),
  excerpt: z
    .string()
    .min(10, "Excerpt must be at least 10 characters")
    .max(500, "Excerpt must be less than 500 characters"),
  content: z.string().min(50, "Content must be at least 50 characters"),
  type: z.enum(PUBLICATION_TYPES),
  category: z.enum(PUBLICATION_CATEGORIES),
  status: z.enum(PUBLICATION_STATUSES),
  authorId: z.string().min(1, "Author is required"),
  coAuthorIds: z.array(z.string()).optional(),
  tagIds: z.array(z.string()).default([]),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
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

export type PublicationFormValues = z.infer<typeof publicationFormSchema>;
