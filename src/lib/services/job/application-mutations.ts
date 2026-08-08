import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { jobApplication, jobPosting } from "@/db/schema";
import { problem } from "@/lib/http";
import {
  APPLICATION_STATUS_TRANSITIONS,
  SELF_SERVICE_TRANSITION,
  type JobApplicationDto,
} from "@/types/jobs.types";
import type { CreateJobApplicationInput, UpdateApplicationStatusInput } from "../job.schemas";
import { JobServiceError } from "./errors";
import { getJobApplication } from "./application-queries";

export async function createApplication(
  jobId: string,
  userId: string,
  input: CreateJobApplicationInput,
): Promise<JobApplicationDto> {
  const postings = await db.select().from(jobPosting).where(eq(jobPosting.id, jobId)).limit(1);
  const posting = postings[0];
  if (!posting)
    throw new JobServiceError(problem("not-found", 404, "Not found", "Job posting not found"));
  if (posting.status !== "PUBLISHED") {
    throw new JobServiceError(
      problem(
        "business-logic-error",
        400,
        "Business logic error",
        "This job is not accepting applications",
      ),
    );
  }
  if (posting.applicationDeadline && posting.applicationDeadline.getTime() < Date.now()) {
    throw new JobServiceError(
      problem(
        "business-logic-error",
        400,
        "Business logic error",
        "The application deadline for this job has passed",
      ),
    );
  }

  const created = await db.transaction(async (tx) => {
    const existing = await tx
      .select({ id: jobApplication.id })
      .from(jobApplication)
      .where(and(eq(jobApplication.jobId, jobId), eq(jobApplication.userId, userId)))
      .limit(1);
    if (existing.length > 0) {
      throw new JobServiceError(
        problem("conflict", 409, "Conflict", "You have already applied to this job"),
      );
    }

    const [application] = await tx
      .insert(jobApplication)
      .values({
        jobId,
        userId,
        coverLetter: input.coverLetter,
        portfolioUrl: input.portfolioUrl,
        salaryExpectation:
          input.salaryExpectation !== undefined ? String(input.salaryExpectation) : null,
        availability: input.availability,
      })
      .returning();

    await tx
      .update(jobPosting)
      .set({ applicationCount: sql`${jobPosting.applicationCount} + 1` })
      .where(eq(jobPosting.id, jobId));

    return application!;
  });

  const dto = await getJobApplication(created.id);
  if (!dto) {
    throw new JobServiceError(
      problem("not-found", 404, "Not found", "Application disappeared after insert"),
    );
  }
  return dto;
}

export async function updateApplicationStatus(
  applicationId: string,
  input: UpdateApplicationStatusInput,
  actor: { id: string; privileged: boolean },
): Promise<JobApplicationDto> {
  const rows = await db
    .select()
    .from(jobApplication)
    .where(eq(jobApplication.id, applicationId))
    .limit(1);
  const current = rows[0];
  if (!current) {
    throw new JobServiceError(problem("not-found", 404, "Not found", "Job application not found"));
  }

  if (!actor.privileged) {
    // Applicants may only withdraw their own application.
    if (current.userId !== actor.id) {
      throw new JobServiceError(
        problem(
          "insufficient-permission",
          403,
          "Insufficient permission",
          "You can only update your own application",
        ),
      );
    }
    if (input.status !== SELF_SERVICE_TRANSITION) {
      throw new JobServiceError(
        problem(
          "insufficient-permission",
          403,
          "Insufficient permission",
          "Applicants can only withdraw their own application",
        ),
      );
    }
  }

  const allowed = APPLICATION_STATUS_TRANSITIONS[current.status];
  if (!allowed.includes(input.status)) {
    throw new JobServiceError(
      problem(
        "conflict",
        409,
        "Conflict",
        `Cannot transition application from ${current.status} to ${input.status}`,
      ),
    );
  }

  await db
    .update(jobApplication)
    .set({ status: input.status, ...(input.notes !== undefined ? { notes: input.notes } : {}) })
    .where(eq(jobApplication.id, applicationId));

  const dto = await getJobApplication(applicationId);
  if (!dto) {
    throw new JobServiceError(
      problem("not-found", 404, "Not found", "Application disappeared after update"),
    );
  }
  return dto;
}
