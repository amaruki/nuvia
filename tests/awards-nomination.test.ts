/**
 * UI-36 — Member award nominations (TDD red phase).
 *
 * Service-level tests against the real Postgres database (the ring-1
 * pattern: `submitMemberNomination`/`listOwnNominations` take the caller's
 * userId, which the route layer binds to the session user). The existing
 * admin nominations API (awards:create) is deliberately untouched — members
 * never needed that permission and must not get it.
 *
 * Documented policies under test:
 *  - Nominations are accepted ONLY for programs that are OPEN right now:
 *    status OPEN and inside the configured open/close date window. DRAFT,
 *    CLOSED, ARCHIVED (and OPEN-but-past-window) all get a 409.
 *  - One nomination per member per program: duplicates get a 409; a
 *    different member nominating the same program is allowed.
 *  - The nominator identity is forced from the session user; nominations
 *    always start "pending"; members only ever list their own nominations.
 *  - Nav gating: the member-visible awards child resolves to the new
 *    nomination surface, and the admin review queue stays admin-gated.
 */

import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/db/client";
import { awardNomination, awardProgram, user } from "@/db/schema";
import { isRoleAllowedForPath } from "@/lib/dashboard-access";
import {
  AwardServiceError,
  createAwardProgram,
  listOpenAwardPrograms,
  listOwnNominations,
  submitMemberNomination,
  type CreateAwardProgramInput,
} from "@/lib/services/award";
import type { AwardProgramStatus } from "@/types/award.types";
import { signUpWithRole } from "./learning-api/helpers";

const RUN_ID = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const MISSING_ID = "00000000-0000-4000-8000-000000000000";

const DAY = 24 * 60 * 60 * 1000;

function programFixture(
  suffix: string,
  status: AwardProgramStatus,
  overrides: Partial<CreateAwardProgramInput> = {},
): CreateAwardProgramInput {
  return {
    name: `ui36-${suffix}-${RUN_ID}`,
    description: `Award program created by the UI-36 nomination suite (${suffix}).`,
    category: "achievement",
    status,
    criteria: ["Open to members in good standing."],
    openDate: new Date(Date.now() - DAY),
    closeDate: new Date(Date.now() + 30 * DAY),
    awardDate: new Date(Date.now() + 60 * DAY),
    ...overrides,
  };
}

function nominationFixture(suffix: string) {
  return {
    nomineeName: `UI36 Nominee ${suffix} ${RUN_ID}`,
    nomineeEmail: `ui36-nominee-${suffix}-${RUN_ID}@example.test`,
    statement: `Supporting statement for the ${suffix} nomination (${RUN_ID}).`,
  };
}

/** Resolves when `fn` throws an AwardServiceError with the given HTTP status. */
async function expectProblem(fn: () => Promise<unknown>, status: number): Promise<void> {
  try {
    await fn();
  } catch (error) {
    expect(error).toBeInstanceOf(AwardServiceError);
    expect((error as AwardServiceError).problemDetails.status).toBe(status);
    return;
  }
  throw new Error(`expected a ${status} problem but the call succeeded`);
}

let memberA: { userId: string; email: string };
let memberB: { userId: string; email: string };
let openProgramId: string;
let openProgramName: string;
let draftProgramId: string;
let closedProgramId: string;
let archivedProgramId: string;
let expiredOpenProgramId: string;
const programIds: string[] = [];

beforeAll(async () => {
  memberA = await signUpWithRole(`ui36-a-${RUN_ID}`, null);
  memberB = await signUpWithRole(`ui36-b-${RUN_ID}`, null);

  const open = await createAwardProgram(programFixture("open", "open"), memberA.email);
  const draft = await createAwardProgram(programFixture("draft", "draft"), memberA.email);
  const closed = await createAwardProgram(programFixture("closed", "closed"), memberA.email);
  const archived = await createAwardProgram(programFixture("archived", "archived"), memberA.email);
  const expiredOpen = await createAwardProgram(
    programFixture("expired", "open", {
      openDate: new Date(Date.now() - 3 * DAY),
      closeDate: new Date(Date.now() - DAY),
    }),
    memberA.email,
  );

  openProgramId = open.id;
  openProgramName = open.name;
  draftProgramId = draft.id;
  closedProgramId = closed.id;
  archivedProgramId = archived.id;
  expiredOpenProgramId = expiredOpen.id;
  programIds.push(open.id, draft.id, closed.id, archived.id, expiredOpen.id);
});

afterAll(async () => {
  // Nominations first (their program FK would cascade anyway), then
  // programs, then users. Guards keep cleanup alive if beforeAll failed.
  if (programIds.length > 0) {
    await db.delete(awardNomination).where(inArray(awardNomination.programId, programIds));
    await db.delete(awardProgram).where(inArray(awardProgram.id, programIds));
  }
  if (memberA?.userId && memberB?.userId) {
    await db.delete(user).where(inArray(user.id, [memberA.userId, memberB.userId]));
  }
});

describe("UI-36 member award nominations (service level)", () => {
  test("members only see OPEN programs, in a ring-safe projection", async () => {
    const programs = await listOpenAwardPrograms();
    const ids = programs.map((program) => program.id);

    expect(ids).toContain(openProgramId);
    expect(ids).not.toContain(draftProgramId);
    expect(ids).not.toContain(closedProgramId);
    expect(ids).not.toContain(archivedProgramId);
    // An OPEN program whose window has passed cannot accept nominations —
    // listing it would be dishonest, so it stays out too.
    expect(ids).not.toContain(expiredOpenProgramId);

    // No admin-only fields leak into the member-facing projection.
    const open = programs.find((program) => program.id === openProgramId);
    expect(open).toBeDefined();
    expect(open?.name).toBe(openProgramName);
    expect("nominationCount" in open!).toBe(false);
    expect("createdBy" in open!).toBe(false);
  });

  test("a nomination is accepted for an OPEN program and lands in the DB", async () => {
    const nomination = await submitMemberNomination(memberA.userId, {
      programId: openProgramId,
      ...nominationFixture("a"),
    });

    expect(nomination.status).toBe("pending"); // always starts pending
    expect(nomination.programId).toBe(openProgramId);
    expect(nomination.programName).toBe(openProgramName);
    expect(nomination.userId).toBe(memberA.userId);
    // Nominator identity is forced from the session user — never the body.
    expect(nomination.nominatorEmail).toBe(memberA.email);

    // Real round-trip in Postgres.
    const rows = await db
      .select()
      .from(awardNomination)
      .where(eq(awardNomination.id, nomination.id));
    expect(rows).toHaveLength(1);
    expect(rows[0].status).toBe("PENDING");
    expect(rows[0].userId).toBe(memberA.userId);
  });

  test("DRAFT, CLOSED and ARCHIVED programs reject nominations with a 409", async () => {
    for (const programId of [draftProgramId, closedProgramId, archivedProgramId]) {
      await expectProblem(
        () =>
          submitMemberNomination(memberA.userId, {
            programId,
            ...nominationFixture("rejected"),
          }),
        409,
      );
    }
  });

  test("an OPEN program whose nomination window has passed also rejects", async () => {
    await expectProblem(
      () =>
        submitMemberNomination(memberA.userId, {
          programId: expiredOpenProgramId,
          ...nominationFixture("expired"),
        }),
      409,
    );
  });

  test("nominating into an unknown program is a 404", async () => {
    await expectProblem(
      () =>
        submitMemberNomination(memberA.userId, {
          programId: MISSING_ID,
          ...nominationFixture("missing"),
        }),
      404,
    );
  });

  test("duplicate nominations are rejected per member per program", async () => {
    // Same member, same program → 409.
    await expectProblem(
      () =>
        submitMemberNomination(memberA.userId, {
          programId: openProgramId,
          ...nominationFixture("a-duplicate"),
        }),
      409,
    );

    // A different member nominating the same program is allowed.
    const other = await submitMemberNomination(memberB.userId, {
      programId: openProgramId,
      ...nominationFixture("b"),
    });
    expect(other.userId).toBe(memberB.userId);
    expect(other.status).toBe("pending");
  });

  test("members only ever list their own nominations", async () => {
    const ownA = await listOwnNominations(memberA.userId);
    const ownB = await listOwnNominations(memberB.userId);

    expect(ownA.length).toBeGreaterThan(0);
    expect(ownB.length).toBeGreaterThan(0);
    expect(ownA.every((nomination) => nomination.userId === memberA.userId)).toBe(true);
    expect(ownB.every((nomination) => nomination.userId === memberB.userId)).toBe(true);

    const idsA = new Set(ownA.map((nomination) => nomination.id));
    expect(ownB.some((nomination) => idsA.has(nomination.id))).toBe(false);
  });
});

describe("UI-36 awards navigation gating", () => {
  test("members get the nomination surface; the review queue stays admin-gated", () => {
    // The new member-facing entry is reachable by every member role…
    expect(isRoleAllowedForPath("/dashboard/awards/nominate", "member_corporate")).toBe(true);
    expect(isRoleAllowedForPath("/dashboard/awards/nominate", "member_professional")).toBe(true);
    expect(isRoleAllowedForPath("/dashboard/awards/nominate", "member_student")).toBe(true);
    expect(isRoleAllowedForPath("/dashboard/awards/nominate", "member")).toBe(true);
    expect(isRoleAllowedForPath("/dashboard/awards/nominate", "user")).toBe(true);

    // …while the admin nominations queue no longer leaks to members.
    expect(isRoleAllowedForPath("/dashboard/awards/nominations", "member_corporate")).toBe(false);
    expect(isRoleAllowedForPath("/dashboard/awards/nominations", "member_student")).toBe(false);
    expect(isRoleAllowedForPath("/dashboard/awards/nominations", "user")).toBe(false);
    // Admins keep the review queue.
    expect(isRoleAllowedForPath("/dashboard/awards/nominations", "admin")).toBe(true);
  });
});
