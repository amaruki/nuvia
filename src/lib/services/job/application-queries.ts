import { and, count, desc, eq, type SQL } from "drizzle-orm";
import { db } from "@/db/client";
import { jobApplication, jobPosting, user } from "@/db/schema";
import type { JobApplicationDto } from "@/types/jobs.types";
import { toApplicationDto, type ApplicationRow } from "./mappers";
import { paginate, type Paginated, type WhereClause } from "./query-helpers";

// ---------------------------------------------------------------------------
// Applications
// ---------------------------------------------------------------------------

function joinedApplicationQuery(where: WhereClause) {
  return db
    .select({
      application: jobApplication,
      jobTitle: jobPosting.title,
      applicantName: user.name,
      applicantEmail: user.email,
    })
    .from(jobApplication)
    .innerJoin(jobPosting, eq(jobApplication.jobId, jobPosting.id))
    .innerJoin(user, eq(jobApplication.userId, user.id))
    .$dynamic()
    .where(where);
}

function flattenApplicationRow(row: {
  application: typeof jobApplication.$inferSelect;
  jobTitle: string | null;
  applicantName: string | null;
  applicantEmail: string | null;
}): ApplicationRow {
  return {
    ...row.application,
    jobTitle: row.jobTitle,
    applicantName: row.applicantName ?? "Unknown applicant",
    applicantEmail: row.applicantEmail ?? "",
  };
}

export async function listJobApplications(
  filters: {
    jobId?: string;
    status?: string;
    page?: number;
    limit?: number;
  } = {},
): Promise<Paginated<JobApplicationDto>> {
  const { page, limit, offset } = paginate(filters.page, filters.limit);

  const conditions: SQL[] = [];
  if (filters.jobId) conditions.push(eq(jobApplication.jobId, filters.jobId));
  if (filters.status) conditions.push(eq(jobApplication.status, filters.status as never));
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, totalResult] = await Promise.all([
    joinedApplicationQuery(where)
      .orderBy(desc(jobApplication.appliedAt))
      .limit(limit)
      .offset(offset),
    db.select({ value: count() }).from(jobApplication).where(where),
  ]);

  const total = totalResult[0]?.value ?? 0;
  return {
    items: rows.map((row) => toApplicationDto(flattenApplicationRow(row))),
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

export async function getJobApplication(applicationId: string): Promise<JobApplicationDto | null> {
  const rows = await joinedApplicationQuery(eq(jobApplication.id, applicationId)).limit(1);
  const row = rows[0];
  return row ? toApplicationDto(flattenApplicationRow(row)) : null;
}

export async function listApplicationsForUser(userId: string): Promise<JobApplicationDto[]> {
  const rows = await joinedApplicationQuery(eq(jobApplication.userId, userId)).orderBy(
    desc(jobApplication.appliedAt),
  );
  return rows.map((row) => toApplicationDto(flattenApplicationRow(row)));
}
