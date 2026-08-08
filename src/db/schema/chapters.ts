/**
 * Chapters — regional chapter management (backlog D1, promotion queue).
 *
 * The tables are driven by the shape the dashboard already renders
 * (src/types/chapter.types.ts): a chapter carries identity, lifecycle
 * status, a location block, contact/social/settings blobs, and a leadership
 * roster. The roster is the chapter ↔ user join model (`chapter_members`):
 * rows may exist without a user account (userId nullable) because the UI
 * renders leadership by name/email alone.
 *
 * metrics/events/finances stay off-schema for now — the service renders
 * neutral defaults for them, the same staging pattern the event service uses
 * for fields whose backing tables land in a later backlog item.
 */

import { relations } from "drizzle-orm";
import {
  boolean,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";
import { chapterRoleEnum, chapterStatusEnum } from "./enums";
import { user } from "./users";

export const chapter = pgTable(
  "chapters",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Machine name, unique — the add/edit form's "name" field. */
    name: text("name").notNull().unique(),
    displayName: text("display_name").notNull(),
    description: text("description"),
    status: chapterStatusEnum("status").notNull().default("PENDING"),
    // --- location block ----------------------------------------------------
    address: text("address"),
    city: text("city"),
    state: text("state"),
    country: text("country"),
    postalCode: text("postal_code"),
    latitude: doublePrecision("latitude"),
    longitude: doublePrecision("longitude"),
    timezone: text("timezone"),
    region: text("region"),
    // --- -------------------------------------------------------------------
    memberCount: integer("member_count").notNull().default(0),
    establishedDate: timestamp("established_date", { withTimezone: true }),
    parentChapterId: uuid("parent_chapter_id").references((): AnyPgColumn => chapter.id, {
      onDelete: "set null",
    }),
    contactInfo: jsonb("contact_info").notNull().default({}),
    socialMedia: jsonb("social_media").notNull().default({}),
    settings: jsonb("settings").notNull().default({}),
    /** Actor identifier at creation time (email, matching the UI field). */
    createdBy: text("created_by").notNull(),
    updatedBy: text("updated_by"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("chapters_status_idx").on(table.status),
    index("chapters_region_idx").on(table.region),
    index("chapters_parent_idx").on(table.parentChapterId),
  ],
);

/**
 * Chapter membership/leadership roster — the join model the mock-era
 * `leadership[]` array implies. userId is nullable so a chapter can list
 * officers that do not hold platform accounts yet.
 */
export const chapterMember = pgTable(
  "chapter_members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    chapterId: uuid("chapter_id")
      .notNull()
      .references(() => chapter.id, { onDelete: "cascade" }),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    role: chapterRoleEnum("role").notNull().default("MEMBER"),
    title: text("title"),
    name: text("name").notNull(),
    email: text("email").notNull(),
    phone: text("phone"),
    avatar: text("avatar"),
    startDate: timestamp("start_date", { withTimezone: true }),
    endDate: timestamp("end_date", { withTimezone: true }),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("chapter_members_chapter_idx").on(table.chapterId),
    index("chapter_members_user_idx").on(table.userId),
  ],
);

export const chapterRelations = relations(chapter, ({ one, many }) => ({
  members: many(chapterMember),
  parent: one(chapter, {
    fields: [chapter.parentChapterId],
    references: [chapter.id],
    relationName: "chapterHierarchy",
  }),
  subChapters: many(chapter, { relationName: "chapterHierarchy" }),
}));

export const chapterMemberRelations = relations(chapterMember, ({ one }) => ({
  chapter: one(chapter, {
    fields: [chapterMember.chapterId],
    references: [chapter.id],
  }),
  user: one(user, {
    fields: [chapterMember.userId],
    references: [user.id],
  }),
}));
