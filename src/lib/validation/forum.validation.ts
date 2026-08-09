/**
 * Public forum form schemas (UI-16 form standard).
 *
 * Client-side mirrors of the constraints the forum route handlers enforce
 * (createPostSchema / createCommentSchema / createReportSchema in
 * src/lib/services/forum/schemas.ts), so the forms reject bad input before
 * it ever reaches the API. Field names and length limits match the server
 * schemas exactly.
 */

import { z } from "zod";

/** Thread types offered by the public "start a thread" form. */
export const FORUM_THREAD_TYPES = ["DISCUSSION", "QUESTION", "RESOURCE"] as const;

/** New-thread form (create-post-form.tsx) -> POST /api/v1/forums/posts. */
export const forumPostSchema = z.object({
  categoryId: z.string().min(1, "This thread needs a category."),
  title: z
    .string()
    .trim()
    .min(1, "Give your thread a title.")
    .max(300, "Title must be at most 300 characters."),
  content: z
    .string()
    .trim()
    .min(1, "Write some content before posting.")
    .max(50000, "Content must be at most 50,000 characters."),
  type: z.enum(FORUM_THREAD_TYPES),
});

/** Comment form (comment-form.tsx) -> POST /api/v1/forums/posts/:id/comments. */
export const forumCommentSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Write a comment before posting.")
    .max(20000, "Comments must be at most 20,000 characters."),
});

/** Report form (report-button.tsx) -> POST /api/v1/forums/reports. */
export const forumReportSchema = z
  .object({
    targetType: z.enum(["POST", "COMMENT"]),
    postId: z.string().min(1, "The reported post id is required.").optional(),
    commentId: z.string().min(1, "The reported comment id is required.").optional(),
    reason: z
      .string()
      .trim()
      .min(1, "Explain why you are reporting this content.")
      .max(1000, "Reports must be at most 1,000 characters."),
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

export type ForumPostFormValues = z.infer<typeof forumPostSchema>;
export type ForumCommentFormValues = z.infer<typeof forumCommentSchema>;
export type ForumReportFormValues = z.infer<typeof forumReportSchema>;
