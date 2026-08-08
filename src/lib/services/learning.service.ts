/**
 * Learning & Development service — course and certificate CRUD over the
 * real `courses` / `certificates` tables (backlog D3).
 *
 * House error style mirrors chapter.service.ts: a ServiceError carrying an
 * RFC 9457 ProblemDetails, PG 23505 mapped to a 409 conflict, zod schemas
 * for create/update, and `{ items, page, limit, total, totalPages }` lists.
 *
 * Courses store instructor fields as flat columns and the UI-only documents
 * (color, features, curriculum modules, reviews) under `metadata.ui` — the
 * same technique content uses for its metadata blob. Certificates
 * denormalize course name/instructor/image at issue time; progress is a
 * neutral 0 until enrollment tracking exists (see schema header).
 */

import { and, count, desc, eq, ilike, or, type SQL } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import { certificate, course } from "@/db/schema/learning";
import { problems, type ProblemDetails } from "@/lib/http";
import type {
  Certificate,
  CertificateStatus,
  Course,
  CourseLevel,
  Module,
  Review,
} from "@/types/learning.types";

export class LearningServiceError extends Error {
  constructor(public readonly problemDetails: ProblemDetails) {
    super(problemDetails.detail ?? problemDetails.title);
    this.name = "LearningServiceError";
  }
}

const UNIQUE_VIOLATION = "23505";

function pgErrorCode(error: unknown): string | null {
  // drizzle wraps the driver error in DrizzleQueryError, so walk the cause
  // chain until a postgres error code surfaces.
  let current: unknown = error;
  for (let depth = 0; depth < 5 && current !== null && typeof current === "object"; depth += 1) {
    const code = (current as { code?: unknown }).code;
    if (typeof code === "string") return code;
    current = (current as { cause?: unknown }).cause;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Validation schemas (mirror the admin course form; the API accepts a small
// superset — rating/students/instructor/reviews — for programmatic callers)
// ---------------------------------------------------------------------------

const lessonSchema = z.object({
  id: z.string().max(100).optional(),
  title: z.string().min(1).max(200),
  duration: z.string().min(1).max(50),
  type: z.enum(["video", "article", "quiz"]),
  isCompleted: z.boolean().optional(),
});

const moduleSchema = z.object({
  id: z.string().max(100).optional(),
  title: z.string().min(1).max(200),
  lessons: z.array(lessonSchema).max(200),
});

const reviewSchema = z.object({
  id: z.string().max(100).optional(),
  user: z.object({
    name: z.string().min(1).max(120),
    avatar: z.string().max(2048).optional(),
  }),
  rating: z.number().min(0).max(5),
  date: z.string().max(100),
  comment: z.string().max(4000),
});

const instructorSchema = z.object({
  name: z.string().min(1).max(120),
  role: z.string().max(120).optional(),
  bio: z.string().max(4000).optional(),
  avatar: z.union([z.string().url().max(2048), z.literal("")]).optional(),
  signature: z.union([z.string().url().max(2048), z.literal("")]).optional(),
});

export const createCourseSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().min(10).max(2000),
  longDescription: z.string().max(8000).optional(),
  category: z.string().min(1).max(100),
  level: z.enum(["Beginner", "Intermediate", "Advanced"]),
  duration: z.string().max(50).optional(),
  students: z.number().int().min(0).optional(),
  rating: z.number().min(0).max(5).optional(),
  price: z.number().min(0).optional(),
  image: z.union([z.string().url().max(2048), z.literal("")]).optional(),
  color: z.string().max(200).optional(),
  instructor: instructorSchema.optional(),
  modules: z.array(moduleSchema).max(50).optional(),
  reviews: z.array(reviewSchema).max(100).optional(),
  features: z.array(z.string().max(300)).max(30).optional(),
});
export type CreateCourseInput = z.infer<typeof createCourseSchema>;

export const updateCourseSchema = createCourseSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one course field must be provided",
  });
export type UpdateCourseInput = z.infer<typeof updateCourseSchema>;

export const issueCertificateSchema = z.object({
  courseId: z.string().uuid(),
  studentName: z.string().min(1).max(120),
  studentEmail: z.string().email().max(320),
  grade: z.string().max(20).optional(),
  expiryDate: z.string().datetime().optional(),
});
export type IssueCertificateInput = z.infer<typeof issueCertificateSchema>;

export const updateCertificateSchema = z
  .object({
    status: z.enum(["active", "revoked"]),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one certificate field must be provided",
  });
export type UpdateCertificateInput = z.infer<typeof updateCertificateSchema>;

// ---------------------------------------------------------------------------
// Level/status mapping (DB enums are SCREAMING_SNAKE, UI is title/lowercase)
// ---------------------------------------------------------------------------

type DbCourseLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
type DbCertificateStatus = "ACTIVE" | "REVOKED";

const UI_TO_DB_LEVEL: Record<CourseLevel, DbCourseLevel> = {
  Beginner: "BEGINNER",
  Intermediate: "INTERMEDIATE",
  Advanced: "ADVANCED",
};

const DB_TO_UI_LEVEL: Record<DbCourseLevel, CourseLevel> = {
  BEGINNER: "Beginner",
  INTERMEDIATE: "Intermediate",
  ADVANCED: "Advanced",
};

const UI_TO_DB_CERT_STATUS: Record<CertificateStatus, DbCertificateStatus> = {
  active: "ACTIVE",
  revoked: "REVOKED",
};

const DB_TO_UI_CERT_STATUS: Record<DbCertificateStatus, CertificateStatus> = {
  ACTIVE: "active",
  REVOKED: "revoked",
};

// ---------------------------------------------------------------------------
// Row mapping
// ---------------------------------------------------------------------------

type CourseRow = typeof course.$inferSelect;
type CertificateRow = typeof certificate.$inferSelect;

/** Gradient used when a course was created without an explicit color. */
const DEFAULT_COURSE_COLOR = "from-blue-500 to-indigo-600";

/** `metadata.ui` — UI-only documents, hydrated with safe fallbacks. */
const courseUiMetadataSchema = z.object({
  color: z.string().max(200).optional(),
  features: z.array(z.string()).optional(),
  modules: z.array(moduleSchema).optional(),
  reviews: z.array(reviewSchema).optional(),
});

function toUiMetadata(raw: unknown): {
  color?: string;
  features?: string[];
  modules?: Module[];
  reviews?: Review[];
} {
  const ui = raw && typeof raw === "object" && "ui" in raw ? raw.ui : undefined;
  const parsed = courseUiMetadataSchema.safeParse(ui);
  if (!parsed.success) return {};
  return {
    ...parsed.data,
    modules: parsed.data.modules ? withModuleIds(parsed.data.modules) : undefined,
    // UI types carry stable ids (React keys); synthesize deterministic ones when absent.
    reviews: parsed.data.reviews?.map((review, reviewIndex) => ({
      ...review,
      id: review.id ?? `review-${reviewIndex}`,
    })),
  };
}

/** UI `Module`s require stable ids; synthesize deterministic ones when absent. */
function withModuleIds(modules: z.infer<typeof moduleSchema>[]): Module[] {
  return modules.map((module, moduleIndex) => ({
    id: module.id ?? `module-${moduleIndex}`,
    title: module.title,
    lessons: module.lessons.map((lesson, lessonIndex) => ({
      id: lesson.id ?? `lesson-${moduleIndex}-${lessonIndex}`,
      title: lesson.title,
      duration: lesson.duration,
      type: lesson.type,
      ...(lesson.isCompleted !== undefined ? { isCompleted: lesson.isCompleted } : {}),
    })),
  }));
}

/** Sums lesson durations ("45 min", "1h 15m", "2h") into a display label. */
export function computeDuration(modules: Module[] | undefined): string {
  let minutes = 0;
  for (const module of modules ?? []) {
    for (const lesson of module.lessons) {
      minutes += parseLessonMinutes(lesson.duration);
    }
  }
  if (minutes <= 0) return "";
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest}m`;
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`;
}

// Module-scope so the patterns compile once, not per lesson in the nested
// loop; sharing is safe because without /g, .exec keeps no lastIndex state.
const LESSON_HOURS_RE = /(\d+(?:\.\d+)?)\s*h/i;
const LESSON_MINUTES_RE = /(\d+)\s*m(?:in)?/i;

function parseLessonMinutes(duration: string): number {
  let total = 0;
  const hours = LESSON_HOURS_RE.exec(duration)?.[1];
  if (hours) total += Number.parseFloat(hours) * 60;
  const mins = LESSON_MINUTES_RE.exec(duration)?.[1];
  if (mins) total += Number.parseInt(mins, 10);
  return Math.round(total);
}

function toUiCourse(row: CourseRow): Course {
  const ui = toUiMetadata(row.metadata);
  const dto: Course = {
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    level: DB_TO_UI_LEVEL[row.level],
    duration: row.duration,
    students: row.students,
    rating: row.rating,
    // Neutral until enrollment tracking exists — never invented.
    progress: 0,
    image: row.image ?? "",
    color: ui.color ?? DEFAULT_COURSE_COLOR,
    modules: ui.modules ?? [],
    reviews: ui.reviews ?? [],
    features: ui.features ?? [],
    updatedAt: row.updatedAt.toISOString(),
  };
  if (row.longDescription !== null) dto.longDescription = row.longDescription;
  if (row.price !== null) dto.price = row.price;
  if (row.instructorName !== null) {
    dto.instructor = {
      id: row.id,
      name: row.instructorName,
      ...(row.instructorRole !== null ? { role: row.instructorRole } : {}),
      ...(row.instructorBio !== null ? { bio: row.instructorBio } : {}),
      ...(row.instructorAvatar !== null ? { avatar: row.instructorAvatar } : {}),
      ...(row.instructorSignature !== null ? { signature: row.instructorSignature } : {}),
    };
  }
  return dto;
}

function toUiCertificate(row: CertificateRow): Certificate {
  const dto: Certificate = {
    id: row.id,
    courseId: row.courseId,
    courseName: row.courseName,
    issueDate: row.issuedAt.toISOString(),
    verificationCode: row.verificationCode,
    image: row.image ?? "",
    studentName: row.studentName,
    studentEmail: row.studentEmail,
    status: DB_TO_UI_CERT_STATUS[row.status],
  };
  if (row.expiryDate !== null) dto.expiryDate = row.expiryDate.toISOString();
  if (row.grade !== null) dto.grade = row.grade;
  if (row.instructorName !== null) dto.instructorName = row.instructorName;
  if (row.instructorSignature !== null) dto.instructorSignature = row.instructorSignature;
  return dto;
}

// ---------------------------------------------------------------------------
// Courses — list / read
// ---------------------------------------------------------------------------

export interface CourseListFilters {
  search?: string;
  category?: string;
  level?: string;
  page?: number;
  limit?: number;
}

export interface Paginated<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

function paginate(page?: number, limit?: number): { page: number; limit: number; offset: number } {
  const safePage = Math.max(1, Math.trunc(page ?? 1));
  const safeLimit = Math.min(100, Math.max(1, Math.trunc(limit ?? 20)));
  return { page: safePage, limit: safeLimit, offset: (safePage - 1) * safeLimit };
}

function buildCourseListWhere(filters: CourseListFilters): SQL | undefined {
  const clauses: SQL[] = [];

  if (filters.level) {
    const dbLevel = UI_TO_DB_LEVEL[filters.level as CourseLevel];
    if (dbLevel) clauses.push(eq(course.level, dbLevel));
  }

  if (filters.category && filters.category.trim().length > 0) {
    clauses.push(eq(course.category, filters.category.trim()));
  }

  if (filters.search && filters.search.trim().length > 0) {
    const term = `%${filters.search.trim()}%`;
    const searchClause = or(
      ilike(course.title, term),
      ilike(course.description, term),
      ilike(course.category, term),
    );
    if (searchClause) clauses.push(searchClause);
  }

  return clauses.length > 0 ? and(...clauses) : undefined;
}

export async function listCourses(filters: CourseListFilters = {}): Promise<Paginated<Course>> {
  const { page, limit, offset } = paginate(filters.page, filters.limit);
  const where = buildCourseListWhere(filters);

  const [{ total }] = await db.select({ total: count() }).from(course).where(where);

  const rows = await db
    .select()
    .from(course)
    .where(where)
    .orderBy(desc(course.createdAt))
    .limit(limit)
    .offset(offset);

  return {
    items: rows.map(toUiCourse),
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

export async function getCourse(id: string): Promise<Course | null> {
  const rows = await db.select().from(course).where(eq(course.id, id)).limit(1);
  return rows.length > 0 ? toUiCourse(rows[0]) : null;
}

// ---------------------------------------------------------------------------
// Courses — write
// ---------------------------------------------------------------------------

function buildUiMetadataBlob(input: CreateCourseInput): { ui: Record<string, unknown> } {
  return {
    ui: {
      color: input.color ?? DEFAULT_COURSE_COLOR,
      features: input.features ?? [],
      modules: input.modules ? withModuleIds(input.modules) : [],
      reviews: input.reviews ?? [],
    },
  };
}

function toCourseInsertValues(input: CreateCourseInput, actor: string) {
  return {
    title: input.title,
    description: input.description,
    ...(input.longDescription !== undefined ? { longDescription: input.longDescription } : {}),
    category: input.category,
    level: UI_TO_DB_LEVEL[input.level],
    duration:
      input.duration ?? computeDuration(input.modules ? withModuleIds(input.modules) : undefined),
    students: input.students ?? 0,
    rating: input.rating ?? 0,
    ...(input.price !== undefined ? { price: input.price } : {}),
    image: input.image || null,
    ...(input.instructor
      ? {
          instructorName: input.instructor.name,
          instructorRole: input.instructor.role ?? null,
          instructorBio: input.instructor.bio ?? null,
          instructorAvatar: input.instructor.avatar || null,
          instructorSignature: input.instructor.signature || null,
        }
      : {}),
    metadata: buildUiMetadataBlob(input),
    createdBy: actor,
  };
}

export async function createCourse(input: CreateCourseInput, actor: string): Promise<Course> {
  let row: CourseRow;
  try {
    [row] = await db.insert(course).values(toCourseInsertValues(input, actor)).returning();
  } catch (error) {
    if (pgErrorCode(error) === UNIQUE_VIOLATION) {
      throw new LearningServiceError(
        problems.conflict("A course with that identity already exists"),
      );
    }
    throw error;
  }
  return toUiCourse(row);
}

export async function updateCourse(
  id: string,
  input: UpdateCourseInput,
  actor: string,
): Promise<Course> {
  const existing = await db.select().from(course).where(eq(course.id, id)).limit(1);
  if (existing.length === 0) {
    throw new LearningServiceError(problems.notFound("Course not found"));
  }

  const patch: Partial<typeof course.$inferInsert> = { updatedBy: actor };
  if (input.title !== undefined) patch.title = input.title;
  if (input.description !== undefined) patch.description = input.description;
  if (input.longDescription !== undefined) patch.longDescription = input.longDescription;
  if (input.category !== undefined) patch.category = input.category;
  if (input.level !== undefined) patch.level = UI_TO_DB_LEVEL[input.level];
  if (input.students !== undefined) patch.students = input.students;
  if (input.rating !== undefined) patch.rating = input.rating;
  if (input.price !== undefined) patch.price = input.price;
  if (input.image !== undefined) patch.image = input.image || null;
  if (input.instructor !== undefined) {
    patch.instructorName = input.instructor.name;
    patch.instructorRole = input.instructor.role ?? null;
    patch.instructorBio = input.instructor.bio ?? null;
    patch.instructorAvatar = input.instructor.avatar || null;
    patch.instructorSignature = input.instructor.signature || null;
  }
  if (input.duration !== undefined) {
    patch.duration = input.duration;
  } else if (input.modules !== undefined) {
    // Keep the derived duration consistent when the curriculum changes.
    patch.duration = computeDuration(withModuleIds(input.modules));
  }

  const uiFieldsProvided =
    input.color !== undefined ||
    input.features !== undefined ||
    input.modules !== undefined ||
    input.reviews !== undefined;
  if (uiFieldsProvided) {
    const existingUi = toUiMetadata(existing[0].metadata);
    patch.metadata = {
      ui: {
        color: input.color ?? existingUi.color ?? DEFAULT_COURSE_COLOR,
        features: input.features ?? existingUi.features ?? [],
        modules: input.modules ? withModuleIds(input.modules) : (existingUi.modules ?? []),
        reviews: input.reviews ?? existingUi.reviews ?? [],
      },
    };
  }

  try {
    await db.update(course).set(patch).where(eq(course.id, id));
  } catch (error) {
    if (pgErrorCode(error) === UNIQUE_VIOLATION) {
      throw new LearningServiceError(
        problems.conflict("A course with that identity already exists"),
      );
    }
    throw error;
  }

  const updated = await getCourse(id);
  if (!updated) {
    throw new LearningServiceError(problems.notFound("Course not found"));
  }
  return updated;
}

export async function deleteCourse(id: string): Promise<boolean> {
  const deleted = await db.delete(course).where(eq(course.id, id)).returning({ id: course.id });
  return deleted.length > 0;
}

// ---------------------------------------------------------------------------
// Certificates — list / read
// ---------------------------------------------------------------------------

export interface CertificateListFilters {
  search?: string;
  status?: string;
  courseId?: string;
  page?: number;
  limit?: number;
}

function buildCertificateListWhere(filters: CertificateListFilters): SQL | undefined {
  const clauses: SQL[] = [];

  if (filters.status) {
    const dbStatus = UI_TO_DB_CERT_STATUS[filters.status as CertificateStatus];
    if (dbStatus) clauses.push(eq(certificate.status, dbStatus));
  }

  if (filters.courseId) {
    clauses.push(eq(certificate.courseId, filters.courseId));
  }

  if (filters.search && filters.search.trim().length > 0) {
    const term = `%${filters.search.trim()}%`;
    const searchClause = or(
      ilike(certificate.studentName, term),
      ilike(certificate.studentEmail, term),
      ilike(certificate.courseName, term),
      ilike(certificate.verificationCode, term),
    );
    if (searchClause) clauses.push(searchClause);
  }

  return clauses.length > 0 ? and(...clauses) : undefined;
}

export async function listCertificates(
  filters: CertificateListFilters = {},
): Promise<Paginated<Certificate>> {
  const { page, limit, offset } = paginate(filters.page, filters.limit);
  const where = buildCertificateListWhere(filters);

  const [{ total }] = await db.select({ total: count() }).from(certificate).where(where);

  const rows = await db
    .select()
    .from(certificate)
    .where(where)
    .orderBy(desc(certificate.issuedAt))
    .limit(limit)
    .offset(offset);

  return {
    items: rows.map(toUiCertificate),
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

export async function getCertificate(id: string): Promise<Certificate | null> {
  const rows = await db.select().from(certificate).where(eq(certificate.id, id)).limit(1);
  return rows.length > 0 ? toUiCertificate(rows[0]) : null;
}

// ---------------------------------------------------------------------------
// Certificates — write
// ---------------------------------------------------------------------------

/** "Advanced React Patterns" → "ADVA-REAC-2026-4821"-style verification code. */
function buildVerificationCode(courseTitle: string, now: Date): string {
  const slug =
    courseTitle
      .split(/\s+/)
      .slice(0, 2)
      .map((word) =>
        word
          .replace(/[^a-zA-Z]/g, "")
          .slice(0, 4)
          .toUpperCase(),
      )
      .filter(Boolean)
      .join("-") || "COURSE";
  const random = Math.floor(1000 + Math.random() * 9000);
  return `${slug}-${now.getFullYear()}-${random}`;
}

export async function issueCertificate(
  input: IssueCertificateInput,
  actor: string,
): Promise<Certificate> {
  const courseRows = await db.select().from(course).where(eq(course.id, input.courseId)).limit(1);
  if (courseRows.length === 0) {
    throw new LearningServiceError(
      problems.businessLogicError("Cannot issue a certificate for an unknown course"),
    );
  }
  const issuingFor = courseRows[0];

  const now = new Date();
  let row: CertificateRow | undefined;
  for (let attempt = 0; attempt < 3 && !row; attempt += 1) {
    try {
      [row] = await db
        .insert(certificate)
        .values({
          courseId: issuingFor.id,
          courseName: issuingFor.title,
          studentName: input.studentName,
          studentEmail: input.studentEmail,
          instructorName: issuingFor.instructorName,
          instructorSignature: issuingFor.instructorSignature,
          verificationCode: buildVerificationCode(issuingFor.title, now),
          ...(input.grade !== undefined ? { grade: input.grade } : {}),
          image: issuingFor.image,
          ...(input.expiryDate !== undefined ? { expiryDate: new Date(input.expiryDate) } : {}),
          issuedBy: actor,
        })
        .returning();
    } catch (error) {
      if (pgErrorCode(error) === UNIQUE_VIOLATION) continue; // code collision — retry
      throw error;
    }
  }
  if (!row) {
    throw new LearningServiceError(
      problems.conflict("Could not allocate a unique verification code"),
    );
  }
  return toUiCertificate(row);
}

export async function updateCertificate(
  id: string,
  input: UpdateCertificateInput,
): Promise<Certificate> {
  const existing = await db.select().from(certificate).where(eq(certificate.id, id)).limit(1);
  if (existing.length === 0) {
    throw new LearningServiceError(problems.notFound("Certificate not found"));
  }

  const target = UI_TO_DB_CERT_STATUS[input.status];
  if (existing[0].status !== target) {
    await db.update(certificate).set({ status: target }).where(eq(certificate.id, id));
  }

  const updated = await getCertificate(id);
  if (!updated) {
    throw new LearningServiceError(problems.notFound("Certificate not found"));
  }
  return updated;
}
