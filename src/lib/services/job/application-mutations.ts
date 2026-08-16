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
import { JobServiceError, UNIQUE_VIOLATION, pgErrorCode } from "./errors";
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

  const created = await db
    .transaction(async (tx) => {
      const existing = await tx
        .select()
        .from(jobApplication)
        .where(and(eq(jobApplication.jobId, jobId), eq(jobApplication.userId, userId)))
        .limit(1);
      const existingRow = existing[0];
      if (existingRow && existingRow.status !== "WITHDRAWN") {
        throw new JobServiceError(
          problem("conflict", 409, "Conflict", "You have already applied to this job"),
        );
      }

      const applicationValues = {
        status: "PENDING" as const,
        coverLetter: input.coverLetter,
        portfolioUrl: input.portfolioUrl,
        salaryExpectation:
          input.salaryExpectation !== undefined ? String(input.salaryExpectation) : null,
        availability: input.availability,
        appliedAt: new Date(),
      };

      const application =
        existingRow !== undefined
          ? // Re-apply after withdrawal (issue #14 follow-up): revive the
            // WITHDRAWN row in place. The partial unique index excludes
            // WITHDRAWN rows, so this is the only shape that can coexist
            // with the index.
            (
              await tx
                .update(jobApplication)
                .set(applicationValues)
                .where(eq(jobApplication.id, existingRow.id))
                .returning()
            )[0]
          : (
              await tx
                .insert(jobApplication)
                .values({ ...applicationValues, jobId, userId })
                .returning()
            )[0];

      // applicationCount is a lifetime total: withdrawals never decrement
      // it (there is no decrement path), so both first-time applications
      // and re-applications bump it.
      await tx
        .update(jobPosting)
        .set({ applicationCount: sql`${jobPosting.applicationCount} + 1` })
        .where(eq(jobPosting.id, jobId));

      return application!;
    })
    .catch((error) => {
      // Last-line defense (issue #14): the partial unique index vetoes a
      // duplicate that slipped past the in-transaction check; the counter
      // bump rolls back with it. Surface a clean 409, not a raw 500.
      if (pgErrorCode(error) === UNIQUE_VIOLATION) {
        throw new JobServiceError(
          problem("conflict", 409, "Conflict", "You have already applied to this job"),
        );
      }
      throw error;
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
