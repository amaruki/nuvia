/**
 * Forum — translated from prisma/schema.prisma's "CONTENT MANAGEMENT
 * MODELS" section (forum half). Served by src/lib/services/forum.service.ts
 * and the /api/v1/forums/** routes.
 */

import { relations } from "drizzle-orm";
import {
  type AnyPgColumn,
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import {
  commentStatusEnum,
  postStatusEnum,
  postTypeEnum,
  reportStatusEnum,
  reportTargetTypeEnum,
} from "./enums";
import { user } from "./users";

export const forumCategory = pgTable("forum_categories", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull().unique(),
  displayName: text("display_name").notNull(),
  description: text("description"),
  icon: text("icon"),
  color: text("color"),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  isPrivate: boolean("is_private").notNull().default(false),
  /** Minimum role required to access this category. */
  requiredRole: text("required_role"),
  parentId: text("parent_id").references((): AnyPgColumn => forumCategory.id),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const forumPost = pgTable(
  "forum_posts",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    categoryId: text("category_id")
      .notNull()
      .references(() => forumCategory.id),
    userId: text("user_id")
      .notNull()
      .references(() => user.id),
    title: text("title").notNull(),
    content: text("content").notNull(),
    type: postTypeEnum("type").notNull().default("DISCUSSION"),
    status: postStatusEnum("status").notNull().default("PUBLISHED"),
    isSticky: boolean("is_sticky").notNull().default(false),
    isLocked: boolean("is_locked").notNull().default(false),
    views: integer("views").notNull().default(0),
    likeCount: integer("like_count").notNull().default(0),
    replyCount: integer("reply_count").notNull().default(0),
    lastReplyAt: timestamp("last_reply_at", { withTimezone: true }),
    tags: text("tags").array().notNull().default([]),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("forum_posts_category_id_idx").on(table.categoryId),
    index("forum_posts_user_id_idx").on(table.userId),
    index("forum_posts_status_idx").on(table.status),
    index("forum_posts_created_at_idx").on(table.createdAt),
    index("forum_posts_is_sticky_idx").on(table.isSticky),
  ],
);

export const forumComment = pgTable(
  "forum_comments",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    postId: text("post_id")
      .notNull()
      .references(() => forumPost.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id),
    content: text("content").notNull(),
    parentId: text("parent_id").references((): AnyPgColumn => forumComment.id),
    status: commentStatusEnum("status").notNull().default("PUBLISHED"),
    likeCount: integer("like_count").notNull().default(0),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("forum_comments_post_id_idx").on(table.postId),
    index("forum_comments_user_id_idx").on(table.userId),
    index("forum_comments_parent_id_idx").on(table.parentId),
    index("forum_comments_created_at_idx").on(table.createdAt),
  ],
);

export const forumAttachment = pgTable("forum_attachments", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  postId: text("post_id")
    .notNull()
    .references(() => forumPost.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(),
  path: text("path").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * User-submitted reports against a post or comment. Exactly one of
 * postId/commentId is set (enforced by the service's zod schemas);
 * targetType says which.
 */
export const forumReport = pgTable(
  "forum_reports",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    targetType: reportTargetTypeEnum("target_type").notNull(),
    postId: text("post_id").references(() => forumPost.id, { onDelete: "cascade" }),
    commentId: text("comment_id").references(() => forumComment.id, { onDelete: "cascade" }),
    reason: text("reason").notNull(),
    status: reportStatusEnum("status").notNull().default("PENDING"),
    reportedById: text("reported_by_id")
      .notNull()
      .references(() => user.id),
    resolvedById: text("resolved_by_id").references(() => user.id),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("forum_reports_post_id_idx").on(table.postId),
    index("forum_reports_comment_id_idx").on(table.commentId),
    index("forum_reports_status_idx").on(table.status),
  ],
);

export const forumCategoryRelations = relations(forumCategory, ({ one, many }) => ({
  parent: one(forumCategory, {
    fields: [forumCategory.parentId],
    references: [forumCategory.id],
    relationName: "categoryHierarchy",
  }),
  children: many(forumCategory, { relationName: "categoryHierarchy" }),
  posts: many(forumPost),
}));

export const forumPostRelations = relations(forumPost, ({ one, many }) => ({
  category: one(forumCategory, { fields: [forumPost.categoryId], references: [forumCategory.id] }),
  author: one(user, { fields: [forumPost.userId], references: [user.id] }),
  comments: many(forumComment),
  attachments: many(forumAttachment),
}));

export const forumCommentRelations = relations(forumComment, ({ one, many }) => ({
  post: one(forumPost, { fields: [forumComment.postId], references: [forumPost.id] }),
  author: one(user, { fields: [forumComment.userId], references: [user.id] }),
  parent: one(forumComment, {
    fields: [forumComment.parentId],
    references: [forumComment.id],
    relationName: "commentReplies",
  }),
  replies: many(forumComment, { relationName: "commentReplies" }),
}));

export const forumReportRelations = relations(forumReport, ({ one }) => ({
  post: one(forumPost, { fields: [forumReport.postId], references: [forumPost.id] }),
  comment: one(forumComment, { fields: [forumReport.commentId], references: [forumComment.id] }),
  reportedBy: one(user, { fields: [forumReport.reportedById], references: [user.id] }),
  resolvedBy: one(user, { fields: [forumReport.resolvedById], references: [user.id] }),
}));

export const forumAttachmentRelations = relations(forumAttachment, ({ one }) => ({
  post: one(forumPost, { fields: [forumAttachment.postId], references: [forumPost.id] }),
}));

export type ForumCategory = typeof forumCategory.$inferSelect;
export type ForumPost = typeof forumPost.$inferSelect;
export type ForumComment = typeof forumComment.$inferSelect;
export type ForumAttachment = typeof forumAttachment.$inferSelect;
export type ForumReport = typeof forumReport.$inferSelect;
