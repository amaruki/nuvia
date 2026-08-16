/**
 * Events management — translated from prisma/schema.prisma's
 * "EVENTS MANAGEMENT MODELS" section. Not wired to any route/service yet
 * (see TODO.md) — structural translation only.
 */

import { relations, sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import {
  eventFormatEnum,
  eventStatusEnum,
  eventTypeEnum,
  eventVisibilityEnum,
  registrationStatusEnum,
  sponsorTierEnum,
} from "./enums";
import { user } from "./users";

export const eventCategory = pgTable("event_categories", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull().unique(),
  displayName: text("display_name"),
  description: text("description"),
  color: text("color"),
  icon: text("icon"),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const event = pgTable(
  "events",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    title: text("title").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description"),
    shortDescription: text("short_description"),
    categoryId: text("category_id")
      .notNull()
      .references(() => eventCategory.id),
    type: eventTypeEnum("type").notNull(),
    format: eventFormatEnum("format").notNull(),
    status: eventStatusEnum("status").notNull(),
    visibility: eventVisibilityEnum("visibility").notNull(),
    capacity: integer("capacity"),
    registeredCount: integer("registered_count").notNull().default(0),
    waitlistCount: integer("waitlist_count").notNull().default(0),
    isVirtual: boolean("is_virtual").notNull().default(false),
    isFree: boolean("is_free").notNull().default(true),
    price: numeric("price", { precision: 10, scale: 2 }),
    currency: text("currency").notNull().default("USD"),
    location: text("location"),
    virtualUrl: text("virtual_url"),
    timezone: text("timezone").notNull(),
    startTime: timestamp("start_time", { withTimezone: true }).notNull(),
    endTime: timestamp("end_time", { withTimezone: true }).notNull(),
    registrationStart: timestamp("registration_start", { withTimezone: true }),
    registrationEnd: timestamp("registration_end", { withTimezone: true }),
    allowWaitlist: boolean("allow_waitlist").notNull().default(true),
    requiresApproval: boolean("requires_approval").notNull().default(false),
    tags: text("tags").array().notNull().default([]),
    metadata: jsonb("metadata"),
    createdBy: text("created_by")
      .notNull()
      .references(() => user.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("events_category_id_idx").on(table.categoryId),
    index("events_type_idx").on(table.type),
    index("events_status_idx").on(table.status),
    index("events_start_time_idx").on(table.startTime),
    index("events_created_by_idx").on(table.createdBy),
  ],
);

export const eventRegistration = pgTable(
  "event_registrations",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    eventId: text("event_id")
      .notNull()
      .references(() => event.id, { onDelete: "cascade" }),
    status: registrationStatusEnum("status").notNull().default("PENDING"),
    registeredAt: timestamp("registered_at", { withTimezone: true }).notNull().defaultNow(),
    checkedInAt: timestamp("checked_in_at", { withTimezone: true }),
    checkedOutAt: timestamp("checked_out_at", { withTimezone: true }),
    qrCode: text("qr_code"),
    ticketData: jsonb("ticket_data"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    // Real DB-level duplicate guard (issue #14). Partial: a canceled
    // registration is replaced in place on re-registration (UPDATE), so
    // only live rows need uniqueness. Must match migration 0015.
    uniqueIndex("event_registrations_user_event_unique")
      .on(table.userId, table.eventId)
      .where(sql`${table.status} <> 'CANCELED'`),
  ],
);

export const eventSpeaker = pgTable("event_speakers", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  eventId: text("event_id")
    .notNull()
    .references(() => event.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  bio: text("bio"),
  title: text("title"),
  company: text("company"),
  photo: text("photo"),
  email: text("email"),
  order: integer("order").notNull().default(0),
  isKeynote: boolean("is_keynote").notNull().default(false),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const eventSponsor = pgTable("event_sponsors", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  eventId: text("event_id")
    .notNull()
    .references(() => event.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  logo: text("logo"),
  website: text("website"),
  description: text("description"),
  tier: sponsorTierEnum("tier").notNull().default("BRONZE"),
  order: integer("order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const eventSession = pgTable("event_sessions", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  eventId: text("event_id")
    .notNull()
    .references(() => event.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  startTime: timestamp("start_time", { withTimezone: true }).notNull(),
  endTime: timestamp("end_time", { withTimezone: true }).notNull(),
  location: text("location"),
  virtualUrl: text("virtual_url"),
  /** Array of speaker info snapshots — not a foreign key, matches original schema. */
  speakers: jsonb("speakers"),
  order: integer("order").notNull().default(0),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const eventCategoryRelations = relations(eventCategory, ({ many }) => ({
  events: many(event),
}));

export const eventRelations = relations(event, ({ one, many }) => ({
  category: one(eventCategory, { fields: [event.categoryId], references: [eventCategory.id] }),
  creator: one(user, { fields: [event.createdBy], references: [user.id] }),
  registrations: many(eventRegistration),
  speakers: many(eventSpeaker),
  sponsors: many(eventSponsor),
  sessions: many(eventSession),
}));

export const eventRegistrationRelations = relations(eventRegistration, ({ one }) => ({
  user: one(user, { fields: [eventRegistration.userId], references: [user.id] }),
  event: one(event, { fields: [eventRegistration.eventId], references: [event.id] }),
}));

export const eventSpeakerRelations = relations(eventSpeaker, ({ one }) => ({
  event: one(event, { fields: [eventSpeaker.eventId], references: [event.id] }),
}));

export const eventSponsorRelations = relations(eventSponsor, ({ one }) => ({
  event: one(event, { fields: [eventSponsor.eventId], references: [event.id] }),
}));

export const eventSessionRelations = relations(eventSession, ({ one }) => ({
  event: one(event, { fields: [eventSession.eventId], references: [event.id] }),
}));

export type EventCategory = typeof eventCategory.$inferSelect;
export type Event = typeof event.$inferSelect;
export type NewEvent = typeof event.$inferInsert;
export type EventRegistration = typeof eventRegistration.$inferSelect;
export type EventSpeaker = typeof eventSpeaker.$inferSelect;
export type EventSponsor = typeof eventSponsor.$inferSelect;
export type EventSession = typeof eventSession.$inferSelect;
