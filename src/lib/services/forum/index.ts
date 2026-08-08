/**
 * Forum service — server-side forum logic behind /api/v1/forums/**.
 *
 * Covers category CRUD, post/comment CRUD, the moderation queue
 * (approve/reject/hide) and user reports. The per-category
 * `requiredRole` gate (forum_categories.required_role) is enforced here,
 * on post and comment creation, so every write path goes through it
 * regardless of which route calls in.
 *
 * Rules of note:
 * - Posts created by actors without `forum:moderate` land in
 *   PENDING_REVIEW (or DRAFT when explicitly requested); actors holding
 *   `forum:moderate` publish directly. That is what feeds the queue.
 * - Post/comment deletion is soft (status -> DELETED) so reports and
 *   audit context survive; category deletion is hard and only allowed
 *   once the category is empty.
 */

export { ForumServiceError, forumProblemFromError } from "./errors";
export type { ForumActor } from "./actor";
export {
  POST_TYPES,
  POST_STATUSES,
  COMMENT_STATUSES,
  createCategorySchema,
  updateCategorySchema,
  createPostSchema,
  updatePostSchema,
  createCommentSchema,
  moderatePostSchema,
  createReportSchema,
  resolveReportSchema,
  listPostsQuerySchema,
} from "./schemas";
export type { AuthorDto, CategoryDto, PostDto, QueuePostDto, CommentDto, ReportDto } from "./types";
export {
  listCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
} from "./categories";
export { listPosts, getPost } from "./post-queries";
export { createPost, updatePost, deletePost } from "./post-mutations";
export { listComments, getComment } from "./comment-queries";
export { createComment, deleteComment } from "./comment-mutations";
export { getModerationQueue, moderatePost } from "./moderation";
export { listReports, createReport, resolveReport } from "./reports";

// Re-export row types for callers/tests that want them.
export type { ForumCategory, ForumPost, ForumComment, ForumReport } from "@/db/schema";
