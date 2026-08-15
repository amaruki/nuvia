import { z } from "zod";

import { CATEGORY_SCOPES, CATEGORY_STATUSES, CATEGORY_TYPES } from "@/types/category.types";
import {
  ANNOUNCEMENT_PRIORITIES,
  ANNOUNCEMENT_TARGET_AUDIENCES,
  ANNOUNCEMENT_TYPES as ANNOUNCEMENT_FORM_TYPES,
} from "@/types/announcement";
import {
  ARTICLE_CATEGORIES as ARTICLE_FORM_CATEGORIES,
  ARTICLE_DIFFICULTIES as ARTICLE_FORM_DIFFICULTIES,
  ARTICLE_FORMATS as ARTICLE_FORM_FORMATS,
  ARTICLE_STATUSES as ARTICLE_FORM_STATUSES,
  ARTICLE_TYPES as ARTICLE_FORM_TYPES,
} from "@/types/article";
import {
  PUBLICATION_CATEGORIES as PUBLICATION_FORM_CATEGORIES,
  PUBLICATION_STATUSES as PUBLICATION_FORM_STATUSES,
  PUBLICATION_TYPES as PUBLICATION_FORM_TYPES,
} from "@/types/publication";

/**
 * Content domain validation (articles, publications, announcements, categories).
 *
 * All schemas validate plain JSON payloads — dates arrive as ISO strings and are
 * normalized by the service layer before touching the database.
 */

// UI-level content types per collection (stored in metadata.ui.type)
export const ARTICLE_TYPES = [
  "article",
  "tutorial",
  "guide",
  "news",
  "documentation",
  "case_study",
  "resource",
] as const;

export const PUBLICATION_TYPES = [
  "whitepaper",
  "report",
  "case_study",
  "research",
  "manual",
  "policy",
  "guide",
  "resource",
] as const;

export const ANNOUNCEMENT_TYPES = [
  "system",
  "event",
  "update",
  "maintenance",
  "policy",
  "urgent",
  "banner",
] as const;

export const CONTENT_STATUSES = ["draft", "review", "published", "archived", "scheduled"] as const;

export const CONTENT_VISIBILITIES = [
  "public",
  "members_only",
  "premium_only",
  "chapter_only",
  "committee_only",
] as const;

export const contentStatusSchema = z.enum(CONTENT_STATUSES, {
  message: "Status must be one of: draft, review, published, archived, scheduled",
});

export const contentVisibilitySchema = z.enum(CONTENT_VISIBILITIES, {
  message:
    "Visibility must be one of: public, members_only, premium_only, chapter_only, committee_only",
});

const dateInputSchema = z.union([z.string(), z.number(), z.date()]);

const seoSchema = z
  .object({
    title: z.string().max(200, "SEO title must be at most 200 characters"),
    description: z.string().max(500, "SEO description must be at most 500 characters"),
    keywords: z.array(z.string()).max(30, "Too many SEO keywords"),
    ogImage: z.string().max(2000),
    canonicalUrl: z.string().max(2000),
  })
  .partial();

/** Fields shared by every content collection. */
const contentBaseSchema = z.object({
  title: z.string().min(1, "Title is required").max(300, "Title must be at most 300 characters"),
  slug: z.string().min(1).max(300, "Slug must be at most 300 characters").optional(),
  excerpt: z.string().max(2000, "Excerpt must be at most 2000 characters").optional(),
  content: z.string().min(1, "Content is required"),
  status: contentStatusSchema.optional(),
  visibility: contentVisibilitySchema.optional(),
  authorId: z.string().min(1).max(100).optional(),
  coAuthorIds: z.array(z.string()).max(20).optional(),
  reviewerId: z.string().max(100).optional(),
  tagIds: z.array(z.string()).max(50).optional(),
  featuredImage: z.string().max(2000).optional(),
  gallery: z.array(z.string()).max(20).optional(),
  attachments: z.array(z.unknown()).optional(),
  publishedAt: dateInputSchema.optional(),
  scheduledFor: dateInputSchema.optional(),
  reviewedAt: dateInputSchema.optional(),
  seo: seoSchema.optional(),
  allowedRoles: z.array(z.string()).max(20).optional(),
  allowedChapters: z.array(z.string()).max(20).optional(),
  allowedCommittees: z.array(z.string()).max(20).optional(),
  commentsEnabled: z.boolean().optional(),
  sharingEnabled: z.boolean().optional(),
  downloadEnabled: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  isPinned: z.boolean().optional(),
  priority: z.number().int().min(-100).max(100).optional(),
  version: z.number().int().min(1).optional(),
  language: z.string().min(2).max(5).optional(),
});

// ── Articles ────────────────────────────────────────────────────────────────

export const createArticleSchema = contentBaseSchema.extend({
  type: z.enum(ARTICLE_TYPES, { message: "Invalid article type" }).optional(),
  category: z.string().max(100).optional(),
  difficulty: z.string().max(50).optional(),
  format: z.string().max(50).optional(),
});

export const updateArticleSchema = createArticleSchema.partial();

// ── Publications ────────────────────────────────────────────────────────────

export const createPublicationSchema = contentBaseSchema.extend({
  type: z.enum(PUBLICATION_TYPES, { message: "Invalid publication type" }).optional(),
  category: z.string().max(100).optional(),
  difficulty: z.string().max(50).optional(),
  format: z.string().max(50).optional(),
});

export const updatePublicationSchema = createPublicationSchema.partial();

// ── Announcements ───────────────────────────────────────────────────────────

export const createAnnouncementSchema = contentBaseSchema.extend({
  type: z.enum(ANNOUNCEMENT_TYPES, { message: "Invalid announcement type" }).optional(),
  category: z.string().max(100).optional(),
  targetAudience: z.string().max(100).optional(),
  targetChapters: z.array(z.string()).max(20).optional(),
  targetCommittees: z.array(z.string()).max(20).optional(),
  expiresAt: dateInputSchema.optional(),
  isUrgent: z.boolean().optional(),
  requiresAcknowledgment: z.boolean().optional(),
  acknowledgmentCount: z.number().int().min(0).optional(),
  sendEmailNotification: z.boolean().optional(),
  sendPushNotification: z.boolean().optional(),
  displayOnHomepage: z.boolean().optional(),
  displayInDashboard: z.boolean().optional(),
});

export const updateAnnouncementSchema = createAnnouncementSchema.partial();

// ── Categories ──────────────────────────────────────────────────────────────

export const createCategorySchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name must be at most 100 characters"),
  slug: z.string().min(1).max(150, "Slug must be at most 150 characters").optional(),
  description: z.string().max(1000, "Description must be at most 1000 characters").optional(),
  type: z.string().max(50).optional(),
  scope: z.string().max(50).optional(),
  status: z.enum(["active", "inactive", "archived"]).optional(),
  color: z.string().max(50).optional(),
  icon: z.string().max(100).optional(),
  emoji: z.string().max(8).optional(),
  order: z.number().int().min(0).optional(),
  parentId: z.string().max(100).optional(),
  allowedRoles: z.array(z.string()).max(20).optional(),
  allowedChapters: z.array(z.string()).max(20).optional(),
  allowedCommittees: z.array(z.string()).max(20).optional(),
});

export const updateCategorySchema = createCategorySchema.partial();

// The dashboard category sheet form validates against this enum-based UI
// schema, while the API payload uses the looser create/update schemas
// above. Both live here so the form and the route never drift apart.
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

// ── Dashboard form sheets ───────────────────────────────────────────────────
// The announcement/article/publication sheets validate against these
// enum-based UI schemas (moved verbatim from the legacy co-located
// add-*-form/schema.ts files), while the API payload uses the looser
// create/update schemas above. Both live here so the form and the route
// never drift apart.

export const announcementFormSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(200, "Title must be less than 200 characters"),
  excerpt: z
    .string()
    .min(10, "Excerpt must be at least 10 characters")
    .max(500, "Excerpt must be less than 500 characters"),
  content: z.string().min(50, "Content must be at least 50 characters"),
  type: z.enum(ANNOUNCEMENT_FORM_TYPES),
  priority: z.enum(ANNOUNCEMENT_PRIORITIES),
  targetAudience: z.enum(ANNOUNCEMENT_TARGET_AUDIENCES),
  status: z.enum(["draft", "published", "scheduled", "review", "archived"]),
  authorId: z.string().min(1, "Author is required"),
  tagIds: z.array(z.string()).default([]),
  featuredImage: z.string().optional(),
  expiresAt: z.date().optional(),
  isPinned: z.boolean().default(false),
  isUrgent: z.boolean().default(false),
  requiresAcknowledgment: z.boolean().default(false),
  sendEmailNotification: z.boolean().default(false),
  sendPushNotification: z.boolean().default(false),
  displayOnHomepage: z.boolean().default(false),
  displayInDashboard: z.boolean().default(false),
  visibility: z.enum([
    "public",
    "members_only",
    "premium_only",
    "chapter_only",
    "committee_only",
  ] as const),
  allowedRoles: z.array(z.string()).default([]),
  allowedChapters: z.array(z.string()).default([]),
  allowedCommittees: z.array(z.string()).default([]),
  commentsEnabled: z.boolean().default(false),
  sharingEnabled: z.boolean().default(true),
  downloadEnabled: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
});

export const articleFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title must be less than 200 characters"),
  slug: z.string().optional(),
  excerpt: z
    .string()
    .min(10, "Excerpt must be at least 10 characters")
    .max(500, "Excerpt must be less than 500 characters"),
  content: z.string().min(50, "Content must be at least 50 characters"),
  type: z.enum(ARTICLE_FORM_TYPES),
  category: z.enum(ARTICLE_FORM_CATEGORIES),
  format: z.enum(ARTICLE_FORM_FORMATS),
  difficulty: z.enum(ARTICLE_FORM_DIFFICULTIES),
  status: z.enum(ARTICLE_FORM_STATUSES),
  authorId: z.string().min(1, "Author is required"),
  coAuthorIds: z.array(z.string()).optional(),
  reviewerId: z.string().optional(),
  tagIds: z.array(z.string()).default([]),
  seriesId: z.string().optional(),
  visibility: z.enum([
    "public",
    "members_only",
    "premium_only",
    "chapter_only",
    "committee_only",
  ] as const),
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

export const publicationFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title must be less than 200 characters"),
  slug: z.string().optional(),
  excerpt: z
    .string()
    .min(10, "Excerpt must be at least 10 characters")
    .max(500, "Excerpt must be less than 500 characters"),
  content: z.string().min(50, "Content must be at least 50 characters"),
  type: z.enum(PUBLICATION_FORM_TYPES),
  category: z.enum(PUBLICATION_FORM_CATEGORIES),
  status: z.enum(PUBLICATION_FORM_STATUSES),
  authorId: z.string().min(1, "Author is required"),
  coAuthorIds: z.array(z.string()).optional(),
  tagIds: z.array(z.string()).default([]),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
  visibility: z.enum([
    "public",
    "members_only",
    "premium_only",
    "chapter_only",
    "committee_only",
  ] as const),
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

// ── List queries ────────────────────────────────────────────────────────────

export const contentListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().max(200).optional(),
  status: z.array(contentStatusSchema).optional(),
  sortBy: z.enum(["title", "createdAt", "updatedAt", "publishedAt"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const categoryListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(100),
  search: z.string().max(200).optional(),
});

// Inferred types
export type CreateArticleInput = z.infer<typeof createArticleSchema>;
export type UpdateArticleInput = z.infer<typeof updateArticleSchema>;
export type CreatePublicationInput = z.infer<typeof createPublicationSchema>;
export type UpdatePublicationInput = z.infer<typeof updatePublicationSchema>;
export type CreateAnnouncementInput = z.infer<typeof createAnnouncementSchema>;
export type UpdateAnnouncementInput = z.infer<typeof updateAnnouncementSchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type ContentListQuery = z.infer<typeof contentListQuerySchema>;
export type CategoryListQuery = z.infer<typeof categoryListQuerySchema>;
export type AnnouncementFormInput = z.input<typeof announcementFormSchema>;
export type AnnouncementFormValues = z.infer<typeof announcementFormSchema>;
export type ArticleFormInput = z.input<typeof articleFormSchema>;
export type ArticleFormValues = z.infer<typeof articleFormSchema>;
export type PublicationFormInput = z.input<typeof publicationFormSchema>;
export type PublicationFormValues = z.infer<typeof publicationFormSchema>;
