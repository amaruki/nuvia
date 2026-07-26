/**
 * Association identity — new in the Drizzle migration.
 *
 * Nuvia has no concept of "the association running this deployment" anywhere
 * in the database; branding, locale, currency and settings live nowhere but
 * hardcoded strings and env vars. This is a singleton row (id = "default"),
 * not a multi-tenant table: v1 is single-association (see
 * docs/adr/0007-single-association-tenant-seam.md). It exists so a
 * deployer can configure their association without a redeploy, and so
 * later multi-tenancy has an actual row to key on rather than a rewrite.
 */

import { jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const organization = pgTable("organizations", {
  id: text("id").primaryKey().default("default"),
  name: text("name").notNull(),
  legalName: text("legal_name"),
  logo: text("logo"),
  website: text("website"),
  supportEmail: text("support_email"),
  locale: text("locale").notNull().default("en"),
  currency: text("currency").notNull().default("USD"),
  timezone: text("timezone").notNull().default("UTC"),
  /** Free-form deployer-configurable settings (feature flags, branding colors, etc.). */
  settings: jsonb("settings").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type Organization = typeof organization.$inferSelect;
export type NewOrganization = typeof organization.$inferInsert;
