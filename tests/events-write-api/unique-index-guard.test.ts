/**
 * Issue #14 regression suite — the "*_unique" indexes are REAL unique
 * indexes, not plain ones.
 *
 * Layer 1: the services stay correct under concurrent self-signup (exactly
 * one row per (user, event) / (job, user), counters never inflated).
 * Layer 2: the DB itself rejects a duplicate live-row insert — proving the
 * index exists and the 409 catch is not just the app-level check.
 */
import { afterAll, afterEach, describe, expect, test } from "bun:test";
import { and, eq } from "drizzle-orm";
import { POST as createPosting } from "@/app/api/v1/jobs/route";
import { db } from "@/db/client";
import { eventRegistration, jobApplication, jobPosting } from "@/db/schema";
import { createApplication, JobServiceError } from "@/lib/services/job";
import { createRegistration } from "@/lib/services/registration.service";
import { createJobsApiFixtures } from "../jobs-api/helpers";
import {
  cleanupTrackedRows,
  createCategory,
  createUser,
  fetchEventCounters,
  problemStatus,
  seedEvent,
  trackRegistration,
} from "../events-write-api/helpers";

afterEach(cleanupTrackedRows);

describe("issue #14 — true unique indexes", () => {
  test("concurrent self-registration: exactly one row, counter not inflated", async () => {
    const organizerId = await createUser("organizer");
    const attendeeId = await createUser("attendee");
    const category = await createCategory("uq-reg");
    const dto = await seedEvent(organizerId, category.name, { capacity: 10 });

    const results = await Promise.allSettled(
      Array.from({ length: 5 }, () => createRegistration(dto.id, attendeeId, {})),
    );
    const wins = results.filter((r) => r.status === "fulfilled");
    const losses = results.filter((r) => r.status === "rejected");

    expect(wins).toHaveLength(1);
    expect(losses).toHaveLength(4);
    // Losers must see a clean 409 conflict, never a raw 500.
    for (const loss of losses) {
      expect(problemStatus((loss as PromiseRejectedResult).reason)).toBe(409);
    }

    const rows = await db
      .select()
      .from(eventRegistration)
      .where(and(eq(eventRegistration.userId, attendeeId), eq(eventRegistration.eventId, dto.id)));
    expect(rows).toHaveLength(1);
    trackRegistration(rows[0].id);
    expect(await fetchEventCounters(dto.id)).toEqual({ registeredCount: 1, waitlistCount: 0 });
  });
});

describe("issue #14 — job applications under concurrency", () => {
  const fx = createJobsApiFixtures();
  const state: { postingId: string; applicantId: string } = { postingId: "", applicantId: "" };
  let admin = { userId: "", cookie: "" };
  let applicant = { userId: "", cookie: "" };

  afterAll(async () => {
    if (state.postingId) {
      await db.delete(jobApplication).where(eq(jobApplication.jobId, state.postingId));
    }
    await fx.teardown();
  });

  test("setup: one published posting + one applicant", async () => {
    ({ admin, applicant } = await fx.setup());
    state.applicantId = applicant.userId;

    const res = await createPosting(
      fx.buildRequest(fx.API, {
        method: "POST",
        cookie: admin.cookie,
        body: fx.postingPayload({ title: `I14 UQ Posting ${fx.RUN_ID}`, status: "PUBLISHED" }),
      }),
    );
    expect(res.status).toBe(201);
    state.postingId = ((await fx.parseEnvelope(res)).data as { id: string }).id;
    fx.postingIds.push(state.postingId);
  });

  test("concurrent applications: exactly one row, applicationCount stays 1", async () => {
    const results = await Promise.allSettled(
      Array.from({ length: 5 }, () => createApplication(state.postingId, applicant.userId, {})),
    );
    const wins = results.filter((r) => r.status === "fulfilled");
    const losses = results.filter((r) => r.status === "rejected");

    expect(wins).toHaveLength(1);
    expect(losses).toHaveLength(4);
    for (const loss of losses) {
      const reason = (loss as PromiseRejectedResult).reason;
      expect(reason).toBeInstanceOf(JobServiceError);
      expect((reason as JobServiceError).problemDetails.status).toBe(409);
    }

    const rows = await db
      .select()
      .from(jobApplication)
      .where(
        and(eq(jobApplication.jobId, state.postingId), eq(jobApplication.userId, applicant.userId)),
      );
    expect(rows).toHaveLength(1);

    const [posting] = await db
      .select({ applicationCount: jobPosting.applicationCount })
      .from(jobPosting)
      .where(eq(jobPosting.id, state.postingId));
    expect(posting.applicationCount).toBe(1);
  });

  test("the DB index itself rejects a duplicate live row", async () => {
    // Bypass the service entirely: a second insert on the same key while the
    // first live row stands can only fail at the unique index. (Explicit
    // await + try/catch: drizzle builders are thenables, so bun's
    // expect().rejects does not treat them as promises.)
    let rejected = false;
    try {
      await db
        .insert(jobApplication)
        .values({ jobId: state.postingId, userId: applicant.userId })
        .returning();
    } catch {
      rejected = true;
    }
    expect(rejected).toBe(true);
  });
});
