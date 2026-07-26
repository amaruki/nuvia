/**
 * CMS content — translated from prisma/schema.prisma's "CONTENT MANAGEMENT
 * MODELS" section (content half). Not wired to any route/service yet.
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
import { contentStatusEnum, contentTypeEnum, contentVisibilityEnum } from "./enums";
import { user } from "./users";

export const contentCategory = pgTable("content_categories", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull().unique(),
  displayName: text("display_name").notNull(),
  description: text("description"),
  icon: text("icon"),
  color: text("color"),
  parentId: text("parent_id").references((): AnyPgColumn => contentCategory.id),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const content = pgTable(
  "content",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    title: text("title").notNull(),
    slug: text("slug").notNull().unique(),
    content: text("content").notNull(),
    excerpt: text("excerpt"),
    type: contentTypeEnum("type").notNull(),
    status: contentStatusEnum("status").notNull().default("DRAFT"),
    visibility: contentVisibilityEnum("visibility").notNull().default("PUBLIC"),
    categoryId: text("category_id").references(() => contentCategory.id),
    authorId: text("author_id")
      .notNull()
      .references(() => user.id),
    featuredImage: text("featured_image"),
    tags: text("tags").array().notNull().default([]),
    metadata: jsonb("metadata"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("content_type_idx").on(table.type),
    index("content_status_idx").on(table.status),
    index("content_author_id_idx").on(table.authorId),
    index("content_published_at_idx").on(table.publishedAt),
  ],
);

export const contentCategoryRelations = relations(contentCategory, ({ one, many }) => ({
  parent: one(contentCategory, {
    fields: [contentCategory.parentId],
    references: [contentCategory.id],
    relationName: "categoryHierarchy",
  }),
  children: many(contentCategory, { relationName: "categoryHierarchy" }),
  content: many(content),
}));

export const contentRelations = relations(content, ({ one }) => ({
  category: one(contentCategory, {
    fields: [content.categoryId],
    references: [contentCategory.id],
  }),
  author: one(user, { fields: [content.authorId], references: [user.id] }),
}));

export type ContentCategory = typeof contentCategory.$inferSelect;
export type Content = typeof content.$inferSelect;
