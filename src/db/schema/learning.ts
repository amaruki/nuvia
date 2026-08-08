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
 * Enrollments/progress stay off-schema for now — the course DTO renders a
 * neutral progress (0) until enrollment tracking lands in a later backlog
 * item, the same staging pattern chapters uses for metrics/events/finances.
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
  uuid,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";

export const courseLevelEnum = pgEnum("course_level", ["BEGINNER", "INTERMEDIATE", "ADVANCED"]);

export const certificateStatusEnum = pgEnum("certificate_status", ["ACTIVE", "REVOKED"]);

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

export const courseRelations = relations(course, ({ many }) => ({
  certificates: many(certificate),
}));

export const certificateRelations = relations(certificate, ({ one }) => ({
  course: one(course, {
    fields: [certificate.courseId],
    references: [course.id],
  }),
}));
