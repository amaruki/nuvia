import { and, count, desc, eq, ilike, or, type SQL } from "drizzle-orm";
import { db } from "@/db/client";
import { course } from "@/db/schema/learning";
import type { Course, CourseLevel } from "@/types/learning.types";
import { problems } from "@/lib/http";
import { toUiCourse } from "./mappers";
import { UI_TO_DB_LEVEL } from "./types";
import { LearningServiceError } from "./errors";
import { paginate, type CourseListFilters, type Paginated } from "./query-helpers";

// ---------------------------------------------------------------------------
// Courses — list / read
// ---------------------------------------------------------------------------

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

/** Throws a 404 LearningServiceError when the course row does not exist. */
export async function assertCourseExists(courseId: string): Promise<void> {
  const rows = await db
    .select({ id: course.id })
    .from(course)
    .where(eq(course.id, courseId))
    .limit(1);
  if (rows.length === 0) {
    throw new LearningServiceError(problems.notFound("Course not found"));
  }
}
