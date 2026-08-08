import { z } from "zod";
import { USER_ROLES } from "@/types/dashboard.types";

// ---------------------------------------------------------------------------
// Zod schemas (routes safeParse with these before calling the service)
// ---------------------------------------------------------------------------

export const POST_TYPES = [
  "DISCUSSION",
  "QUESTION",
  "ANNOUNCEMENT",
  "POLL",
  "RESOURCE",
  "JOB_POSTING",
  "EVENT_PROMOTION",
] as const;

export const POST_STATUSES = [
  "DRAFT",
  "PENDING_REVIEW",
  "PUBLISHED",
  "ARCHIVED",
  "DELETED",
  "HIDDEN",
] as const;

export const COMMENT_STATUSES = ["PUBLISHED", "PENDING", "HIDDEN", "DELETED"] as const;

const slugSchema = z
  .string()
  .trim()
  .min(1)
  .max(100)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase letters, digits and dashes");

export const createCategorySchema = z.object({
  name: z.string().trim().min(1).max(120),
  slug: slugSchema.optional(),
  description: z.string().trim().max(2000).optional(),
  icon: z.string().trim().max(64).optional(),
  color: z.string().trim().max(32).optional(),
  sortOrder: z.number().int().min(0).max(10000).optional(),
  isActive: z.boolean().optional(),
  isPrivate: z.boolean().optional(),
  requiredRole: z.enum(USER_ROLES).nullish(),
  parentId: z.string().min(1).nullish(),
});

export const updateCategorySchema = createCategorySchema.partial();

export const createPostSchema = z.object({
  categoryId: z.string().min(1),
  title: z.string().trim().min(1).max(300),
  content: z.string().trim().min(1).max(50000),
  type: z.enum(POST_TYPES).optional(),
  status: z.enum(POST_STATUSES).optional(),
  tags: z.array(z.string().trim().min(1).max(64)).max(20).optional(),
});

export const updatePostSchema = z.object({
  categoryId: z.string().min(1).optional(),
  title: z.string().trim().min(1).max(300).optional(),
  content: z.string().trim().min(1).max(50000).optional(),
  type: z.enum(POST_TYPES).optional(),
  status: z.enum(POST_STATUSES).optional(),
  isSticky: z.boolean().optional(),
  isLocked: z.boolean().optional(),
  tags: z.array(z.string().trim().min(1).max(64)).max(20).optional(),
});

export const createCommentSchema = z.object({
  content: z.string().trim().min(1).max(20000),
  parentId: z.string().min(1).optional(),
});

export const moderatePostSchema = z
  .object({
    action: z.enum(["approve", "reject", "hide"]),
    reason: z.string().trim().min(1).max(1000).optional(),
  })
  .refine((value) => value.action !== "reject" || Boolean(value.reason), {
    message: "reason is required when rejecting a post",
    path: ["reason"],
  });

export const createReportSchema = z
  .object({
    targetType: z.enum(["POST", "COMMENT"]),
    postId: z.string().min(1).optional(),
    commentId: z.string().min(1).optional(),
    reason: z.string().trim().min(1).max(1000),
  })
  .refine(
    (value) =>
      value.targetType === "POST"
        ? Boolean(value.postId) && !value.commentId
        : Boolean(value.commentId) && !value.postId,
    {
      message: "Provide exactly the target id matching targetType",
      path: ["targetType"],
    },
  );

export const resolveReportSchema = z.object({
  action: z.enum(["RESOLVED", "DISMISSED"]),
  deleteContent: z.boolean().optional(),
});

export const listPostsQuerySchema = z.object({
  categoryId: z.string().min(1).optional(),
  status: z.enum(POST_STATUSES).optional(),
  authorId: z.string().min(1).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
