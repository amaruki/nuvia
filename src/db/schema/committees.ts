/**
 * Committees — real tables backing the committees module (backlog D2).
 * Served by src/lib/services/committee/ and the
 * /api/v1/committees/** routes.
 *
 * The UI shape in src/types/committee.types.ts stays the API contract:
 * charter, meetings and metrics travel as jsonb (the same technique
 * events/content/membership use for nested documents), and leadership and
 * regular members share one `committee_members` table, split by `role` in
 * the service layer.
 */

import { relations } from "drizzle-orm";
import {
  type AnyPgColumn,
  boolean,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { user } from "./users";

export const committee = pgTable(
  "committees",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Stable slug-like handle, e.g. "finance_committee". Unique. */
    name: text("name").notNull().unique(),
    displayName: text("display_name").notNull(),
    description: text("description"),
    /** The committee's mandate / focus statement. */
    purpose: text("purpose").notNull(),
    /** active | inactive | pending | suspended */
    status: text("status").notNull().default("pending"),
    /** executive | functional | special_interest | ad_hoc | standing */
    type: text("type").notNull().default("functional"),
    /** advisory | operational | strategic | executive — mirrors charter.authorityLevel. */
    authorityLevel: text("authority_level").notNull().default("advisory"),
    /** Full charter document (mission, responsibilities, term limits, review dates). */
    charter: jsonb("charter").notNull().default({}),
    contactEmail: text("contact_email").notNull(),
    contactPhone: text("contact_phone"),
    meetingLocation: text("meeting_location"),
    virtualMeetingLink: text("virtual_meeting_link"),
    website: text("website"),
    /** Meeting records (title, date, agenda, action items, minutes). */
    meetings: jsonb("meetings").notNull().default([]),
    /** Performance counters surfaced on the dashboard. */
    metrics: jsonb("metrics").notNull().default({}),
    parentCommitteeId: uuid("parent_committee_id").references((): AnyPgColumn => committee.id),
    createdBy: text("created_by")
      .notNull()
      .references(() => user.id),
    updatedBy: text("updated_by").references(() => user.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("committees_status_idx").on(table.status),
    index("committees_type_idx").on(table.type),
    index("committees_parent_committee_id_idx").on(table.parentCommitteeId),
  ],
);

export const committeeMember = pgTable(
  "committee_members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    committeeId: uuid("committee_id")
      .notNull()
      .references(() => committee.id, { onDelete: "cascade" }),
    /** Nullable — rosters may list people without a login (yet). */
    userId: text("user_id").references(() => user.id),
    name: text("name").notNull(),
    email: text("email").notNull(),
    /** chair | co_chair | secretary | treasurer | member | advisor */
    role: text("role").notNull().default("member"),
    title: text("title"),
    joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
    endedAt: timestamp("ended_at", { withTimezone: true }),
    isActive: boolean("is_active").notNull().default(true),
    expertise: text("expertise").array().notNull().default([]),
    /** high | medium | low */
    contributionLevel: text("contribution_level"),
    responsibilities: text("responsibilities").array().notNull().default([]),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("committee_members_committee_id_idx").on(table.committeeId),
    index("committee_members_user_id_idx").on(table.userId),
  ],
);

export const committeeRelations = relations(committee, ({ one, many }) => ({
  members: many(committeeMember),
  parentCommittee: one(committee, {
    fields: [committee.parentCommitteeId],
    references: [committee.id],
    relationName: "committeeHierarchy",
  }),
  subCommittees: many(committee, { relationName: "committeeHierarchy" }),
}));

export const committeeMemberRelations = relations(committeeMember, ({ one }) => ({
  committee: one(committee, {
    fields: [committeeMember.committeeId],
    references: [committee.id],
  }),
  user: one(user, { fields: [committeeMember.userId], references: [user.id] }),
}));
