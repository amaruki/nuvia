import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { course } from "@/db/schema/learning";
import { problems } from "@/lib/http";
import type { Course } from "@/types/learning.types";
import { getCourse } from "./course-queries";
import { LearningServiceError, pgErrorCode, UNIQUE_VIOLATION } from "./errors";
import { computeDuration } from "./helpers";
import { toUiCourse, toUiMetadata, withModuleIds } from "./mappers";
import type { CreateCourseInput, UpdateCourseInput } from "./schemas";
import { DEFAULT_COURSE_COLOR, UI_TO_DB_LEVEL, type CourseRow } from "./types";

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
