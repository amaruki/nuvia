/**
 * Learning & Development — courses and certificates (backlog D3, promotion queue).
 *
 * The tables are driven by the shape the dashboard already renders
 * (src/types/learning.types.ts): a course carries identity, catalog
 * metadata (category/level/duration/students/rating/price), instructor
 * fields as flat columns, and a `metadata.ui` jsonb blob for the UI-only
 * documents (color, features, curriculum modules, reviews) — the same
 * technique content uses for its metadata blob. Certificates are durable
 * records: they denormalize the course name, instructor and badge image at
 * issue time so later course edits or deletion never rewrite issued history.
 *
 * Enrollments are tracked in the additive `course_enrollments` table
 * (backlog UI-35): one row per member per course with status, honest
 * 0–100 progress and enrolled/completed timestamps. The catalog course DTO
 * keeps a neutral progress (0); per-member progress lives on the
 * enrollment DTO and is never invented.
 */

import { relations } from "drizzle-orm";
import {
  doublePrecision,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";
import { user } from "./users";

export const courseLevelEnum = pgEnum("course_level", ["BEGINNER", "INTERMEDIATE", "ADVANCED"]);

export const certificateStatusEnum = pgEnum("certificate_status", ["ACTIVE", "REVOKED"]);

export const courseEnrollmentStatusEnum = pgEnum("course_enrollment_status", [
  "ENROLLED",
  "COMPLETED",
  "CANCELED",
]);

export const course = pgTable(
  "courses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    longDescription: text("long_description"),
    category: text("category").notNull(),
    level: courseLevelEnum("level").notNull().default("BEGINNER"),
    /** Display label ("6h 30m"); derived from the curriculum on create when omitted. */
    duration: text("duration").notNull().default(""),
    students: integer("students").notNull().default(0),
    rating: doublePrecision("rating").notNull().default(0),
    price: doublePrecision("price"),
    image: text("image"),
    // --- instructor (flat columns — the UI renders no instructor entity) ---
    instructorName: text("instructor_name"),
    instructorRole: text("instructor_role"),
    instructorBio: text("instructor_bio"),
    instructorAvatar: text("instructor_avatar"),
    instructorSignature: text("instructor_signature"),
    // --- -------------------------------------------------------------------
    /** UI-only blob — `metadata.ui` holds { color, features, modules, reviews }. */
    metadata: jsonb("metadata").notNull().default({}),
    /** Actor identifier at creation time (email, matching the chapters convention). */
    createdBy: text("created_by").notNull(),
    updatedBy: text("updated_by"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("courses_category_idx").on(table.category),
    index("courses_level_idx").on(table.level),
  ],
);

/**
 * Issued certificate. `course_id` is nullable (set null on course delete)
 * while `course_name`/instructor/image are denormalized at issue time — a
 * certificate must survive its course.
 */
export const certificate = pgTable(
  "certificates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    courseId: uuid("course_id").references((): AnyPgColumn => course.id, {
      onDelete: "set null",
    }),
    courseName: text("course_name").notNull(),
    studentName: text("student_name").notNull(),
    studentEmail: text("student_email").notNull(),
    instructorName: text("instructor_name"),
    instructorSignature: text("instructor_signature"),
    verificationCode: text("verification_code").notNull().unique(),
    grade: text("grade"),
    image: text("image"),
    status: certificateStatusEnum("status").notNull().default("ACTIVE"),
    issuedAt: timestamp("issued_at", { withTimezone: true }).notNull().defaultNow(),
    expiryDate: timestamp("expiry_date", { withTimezone: true }),
    /** Actor identifier of the issuer (email). */
    issuedBy: text("issued_by").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("certificates_course_idx").on(table.courseId),
    index("certificates_student_email_idx").on(table.studentEmail),
    index("certificates_status_idx").on(table.status),
  ],
);

/**
 * A member's enrollment in a course (backlog UI-35 — the additive Phase 2
 * table). Unique per user+course; unenrolling cancels the row instead of
 * deleting it so enrollment history stays honest. Both FKs cascade:
 * deleting a user or a course removes its enrollments.
 */
export const courseEnrollment = pgTable(
  "course_enrollments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references((): AnyPgColumn => user.id, { onDelete: "cascade" }),
    courseId: uuid("course_id")
      .notNull()
      .references((): AnyPgColumn => course.id, { onDelete: "cascade" }),
    status: courseEnrollmentStatusEnum("status").notNull().default("ENROLLED"),
    /** Honest 0–100 progress; defaults to 0, never invented. */
    progress: integer("progress").notNull().default(0),
    enrolledAt: timestamp("enrolled_at", { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique("course_enrollments_user_course_uniq").on(table.userId, table.courseId),
    index("course_enrollments_user_idx").on(table.userId),
    index("course_enrollments_course_idx").on(table.courseId),
    index("course_enrollments_status_idx").on(table.status),
  ],
);

export const courseRelations = relations(course, ({ many }) => ({
  certificates: many(certificate),
  enrollments: many(courseEnrollment),
}));

export const courseEnrollmentRelations = relations(courseEnrollment, ({ one }) => ({
  user: one(user, { fields: [courseEnrollment.userId], references: [user.id] }),
  course: one(course, { fields: [courseEnrollment.courseId], references: [course.id] }),
}));

export const certificateRelations = relations(certificate, ({ one }) => ({
  course: one(course, {
    fields: [certificate.courseId],
    references: [course.id],
  }),
}));
