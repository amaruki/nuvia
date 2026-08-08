import { z } from "zod";

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
