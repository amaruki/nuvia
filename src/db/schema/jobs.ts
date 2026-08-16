/**
 * Job board — translated from prisma/schema.prisma's "JOB BOARD MANAGEMENT
 * MODELS" section. Not wired to any route/service yet.
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
  applicationStatusEnum,
  employmentTypeEnum,
  experienceLevelEnum,
  jobStatusEnum,
} from "./enums";
import { user } from "./users";

export const jobCategory = pgTable("job_categories", {
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
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const jobType = pgTable("job_types", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull().unique(),
  displayName: text("display_name").notNull(),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const location = pgTable("locations", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull().unique(),
  displayName: text("display_name").notNull(),
  country: text("country"),
  state: text("state"),
  city: text("city"),
  remote: boolean("remote").notNull().default(false),
  timezone: text("timezone"),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const company = pgTable("companies", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull().unique(),
  displayName: text("display_name").notNull(),
  description: text("description"),
  logo: text("logo"),
  website: text("website"),
  industry: text("industry"),
  /** Free-text bucket, e.g. "1-10", "11-50". */
  size: text("size"),
  foundedYear: integer("founded_year"),
  location: text("location"),
  isVerified: boolean("is_verified").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const jobPosting = pgTable(
  "job_postings",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    title: text("title").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description").notNull(),
    requirements: text("requirements"),
    responsibilities: text("responsibilities"),
    benefits: text("benefits"),
    categoryId: text("category_id")
      .notNull()
      .references(() => jobCategory.id),
    typeId: text("type_id")
      .notNull()
      .references(() => jobType.id),
    locationId: text("location_id")
      .notNull()
      .references(() => location.id),
    companyId: text("company_id")
      .notNull()
      .references(() => company.id),
    postedBy: text("posted_by")
      .notNull()
      .references(() => user.id),
    status: jobStatusEnum("status").notNull().default("DRAFT"),
    employmentType: employmentTypeEnum("employment_type").notNull(),
    experienceLevel: experienceLevelEnum("experience_level").notNull(),
    salaryMin: numeric("salary_min", { precision: 10, scale: 2 }),
    salaryMax: numeric("salary_max", { precision: 10, scale: 2 }),
    currency: text("currency").notNull().default("USD"),
    isRemote: boolean("is_remote").notNull().default(false),
    isFeatured: boolean("is_featured").notNull().default(false),
    applicationDeadline: timestamp("application_deadline", { withTimezone: true }),
    viewCount: integer("view_count").notNull().default(0),
    applicationCount: integer("application_count").notNull().default(0),
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
    index("job_postings_category_id_idx").on(table.categoryId),
    index("job_postings_type_id_idx").on(table.typeId),
    index("job_postings_location_id_idx").on(table.locationId),
    index("job_postings_company_id_idx").on(table.companyId),
    index("job_postings_status_idx").on(table.status),
    index("job_postings_published_at_idx").on(table.publishedAt),
    index("job_postings_is_featured_idx").on(table.isFeatured),
  ],
);

export const jobApplication = pgTable(
  "job_applications",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    jobId: text("job_id")
      .notNull()
      .references(() => jobPosting.id),
    userId: text("user_id")
      .notNull()
      .references(() => user.id),
    status: applicationStatusEnum("status").notNull().default("PENDING"),
    coverLetter: text("cover_letter"),
    resumePath: text("resume_path"),
    portfolioUrl: text("portfolio_url"),
    salaryExpectation: numeric("salary_expectation", { precision: 10, scale: 2 }),
    availability: text("availability"),
    notes: text("notes"),
    metadata: jsonb("metadata"),
    appliedAt: timestamp("applied_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    // Real DB-level duplicate guard (issue #14). Partial: withdrawn
    // applications are replaced in place on re-application (UPDATE), so
    // only non-withdrawn rows need uniqueness. Must match migration 0015.
    uniqueIndex("job_applications_job_user_unique")
      .on(table.jobId, table.userId)
      .where(sql`${table.status} <> 'WITHDRAWN'`),
  ],
);

export const jobCategoryRelations = relations(jobCategory, ({ many }) => ({
  jobs: many(jobPosting),
}));
export const jobTypeRelations = relations(jobType, ({ many }) => ({ jobs: many(jobPosting) }));
export const locationRelations = relations(location, ({ many }) => ({ jobs: many(jobPosting) }));
export const companyRelations = relations(company, ({ many }) => ({ jobs: many(jobPosting) }));

export const jobPostingRelations = relations(jobPosting, ({ one, many }) => ({
  category: one(jobCategory, { fields: [jobPosting.categoryId], references: [jobCategory.id] }),
  type: one(jobType, { fields: [jobPosting.typeId], references: [jobType.id] }),
  location: one(location, { fields: [jobPosting.locationId], references: [location.id] }),
  company: one(company, { fields: [jobPosting.companyId], references: [company.id] }),
  postedByUser: one(user, { fields: [jobPosting.postedBy], references: [user.id] }),
  applications: many(jobApplication),
}));

export const jobApplicationRelations = relations(jobApplication, ({ one }) => ({
  job: one(jobPosting, { fields: [jobApplication.jobId], references: [jobPosting.id] }),
  applicant: one(user, { fields: [jobApplication.userId], references: [user.id] }),
}));

export type JobCategory = typeof jobCategory.$inferSelect;
export type JobType = typeof jobType.$inferSelect;
export type Location = typeof location.$inferSelect;
export type Company = typeof company.$inferSelect;
export type JobPosting = typeof jobPosting.$inferSelect;
export type JobApplication = typeof jobApplication.$inferSelect;
