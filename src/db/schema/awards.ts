/**
 * Awards — real award programs and nominations (backlog D4).
 *
 * Two tables back the dashboard pages at /dashboard/awards/*:
 * `award_programs` carries an award's identity, lifecycle status, category,
 * eligibility criteria (jsonb bullet list), and the nomination window /
 * ceremony dates. `award_nominations` is the submission record against a
 * program: nominee name/email (optionally linked to a member account via
 * nullable userId), nominator identity, review status, and the supporting
 * statement. Deleting a program cascades its nominations.
 *
 * The pgEnums live in this file (not enums.ts) on purpose: they are private
 * to the awards module, matching the task's "define pgEnums inside this
 * file" constraint. DB values stay SCREAMING_SNAKE like every other enum in
 * the schema; the award service maps them to lowercase UI strings.
 */

import { relations } from "drizzle-orm";
import { index, jsonb, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { user } from "./users";

export const awardProgramStatusEnum = pgEnum("AwardProgramStatus", [
  "DRAFT",
  "OPEN",
  "CLOSED",
  "ARCHIVED",
]);

export const awardCategoryEnum = pgEnum("AwardCategory", [
  "ACHIEVEMENT",
  "SERVICE",
  "LEADERSHIP",
  "INNOVATION",
  "SCHOLARSHIP",
  "LIFETIME_ACHIEVEMENT",
]);

export const awardNominationStatusEnum = pgEnum("AwardNominationStatus", [
  "PENDING",
  "UNDER_REVIEW",
  "APPROVED",
  "REJECTED",
]);

export const awardProgram = pgTable(
  "award_programs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Machine name, unique — duplicate creates surface as 409. */
    name: text("name").notNull().unique(),
    description: text("description"),
    category: awardCategoryEnum("category").notNull().default("ACHIEVEMENT"),
    status: awardProgramStatusEnum("status").notNull().default("DRAFT"),
    /** Eligibility/selection criteria as free-text bullets. */
    criteria: jsonb("criteria").notNull().default([]),
    /** Nomination window open (inclusive). */
    openDate: timestamp("open_date", { withTimezone: true }),
    /** Nomination deadline (inclusive). */
    closeDate: timestamp("close_date", { withTimezone: true }),
    /** Date the award is conferred. */
    awardDate: timestamp("award_date", { withTimezone: true }),
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
    index("award_programs_status_idx").on(table.status),
    index("award_programs_category_idx").on(table.category),
  ],
);

/**
 * A nomination submitted against an award program. userId is nullable so a
 * nominee without a platform account can still be nominated by name/email.
 */
export const awardNomination = pgTable(
  "award_nominations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    programId: uuid("program_id")
      .notNull()
      .references(() => awardProgram.id, { onDelete: "cascade" }),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    nomineeName: text("nominee_name").notNull(),
    nomineeEmail: text("nominee_email").notNull(),
    nominatorName: text("nominator_name").notNull(),
    nominatorEmail: text("nominator_email").notNull(),
    status: awardNominationStatusEnum("status").notNull().default("PENDING"),
    statement: text("statement"),
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
    index("award_nominations_program_idx").on(table.programId),
    index("award_nominations_status_idx").on(table.status),
    index("award_nominations_user_idx").on(table.userId),
  ],
);

export const awardProgramRelations = relations(awardProgram, ({ many }) => ({
  nominations: many(awardNomination),
}));

export const awardNominationRelations = relations(awardNomination, ({ one }) => ({
  program: one(awardProgram, {
    fields: [awardNomination.programId],
    references: [awardProgram.id],
  }),
  user: one(user, {
    fields: [awardNomination.userId],
    references: [user.id],
  }),
}));
