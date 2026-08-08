import { z } from "zod";
import type { Certificate, Course, Module, Review } from "@/types/learning.types";
import { moduleSchema, reviewSchema } from "./schemas";
import {
  DB_TO_UI_CERT_STATUS,
  DB_TO_UI_LEVEL,
  DEFAULT_COURSE_COLOR,
  type CertificateRow,
  type CourseRow,
} from "./types";

// ---------------------------------------------------------------------------
// Row mapping
// ---------------------------------------------------------------------------

/** `metadata.ui` — UI-only documents, hydrated with safe fallbacks. */
const courseUiMetadataSchema = z.object({
  color: z.string().max(200).optional(),
  features: z.array(z.string()).optional(),
  modules: z.array(moduleSchema).optional(),
  reviews: z.array(reviewSchema).optional(),
});

export function toUiMetadata(raw: unknown): {
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
export function withModuleIds(modules: z.infer<typeof moduleSchema>[]): Module[] {
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

export function toUiCourse(row: CourseRow): Course {
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

export function toUiCertificate(row: CertificateRow): Certificate {
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
