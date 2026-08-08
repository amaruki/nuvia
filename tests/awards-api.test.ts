/**
 * D4 — Awards API integration tests.
 *
 * Covers the real award programs + nominations resources end to end through
 * the route handlers (no HTTP server needed): authentication/RBAC, create
 * validation, unique-name conflicts, read/update/delete, list filters +
 * pagination meta, and the cascade from program deletion to nominations.
 *
 * Isolation: every fixture name/email embeds RUN_ID; assertions use the
 * baseline-delta technique (search=RUN_ID) so the shared test database can
 * hold rows from other runs. afterAll sweeps by RUN_ID, so an aborted suite
 * still self-cleans on the next run's delete path.
 */

import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { eq, inArray, like } from "drizzle-orm";
import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db/client";
import { awardNomination, awardProgram, user } from "@/db/schema";
import { testIp } from "./helpers";

import { GET as listPrograms, POST as createProgram } from "@/app/api/v1/awards/programs/route";
import {
  DELETE as deleteProgram,
  GET as getProgram,
  PATCH as updateProgram,
} from "@/app/api/v1/awards/programs/[id]/route";
import {
  GET as listNominations,
  POST as createNomination,
} from "@/app/api/v1/awards/nominations/route";
import {
  DELETE as deleteNomination,
  GET as getNomination,
  PATCH as updateNomination,
} from "@/app/api/v1/awards/nominations/[id]/route";
import {
  createAwardProgram as createAwardProgramDirect,
  deleteAwardProgram as deleteAwardProgramDirect,
  getAwardNomination as getAwardNominationDirect,
  getAwardProgram as getAwardProgramDirect,
} from "@/lib/services/award";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const RUN_ID = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const PASSWORD = "Sup3r-Secret-Passw0rd!";
const PROGRAMS_API = "http://localhost:3000/api/v1/awards/programs";
const NOMINATIONS_API = "http://localhost:3000/api/v1/awards/nominations";

const userIds: string[] = [];
const programIds: string[] = [];

/** Values shared between ordered tests within this file. */
const state: Record<string, string> = {};

interface RequestOptions {
  method?: string;
  cookie?: string;
  body?: unknown;
}

interface ListMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface ValidationIssue {
  field: string;
  message: string;
}

interface WireProgram {
  id: string;
  name: string;
  description: string;
  category: string;
  status: string;
  criteria: string[];
  openDate: string | null;
  closeDate: string | null;
  awardDate: string | null;
  nominationCount: number;
  createdBy: string;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

interface WireNomination {
  id: string;
  programId: string;
  programName: string;
  userId: string | null;
  nomineeName: string;
  nomineeEmail: string;
  nominatorName: string;
  nominatorEmail: string;
  status: string;
  statement: string;
  createdBy: string;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

function buildRequest(url: string, options: RequestOptions = {}): NextRequest {
  const headers = new Headers();
  headers.set("x-forwarded-for", testIp());
  if (options.cookie) headers.set("cookie", options.cookie);
  if (options.body !== undefined) headers.set("content-type", "application/json");
  return new NextRequest(url, {
    method: options.method ?? "GET",
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });
}

function ctx<T extends Record<string, string>>(params: T): { params: Promise<T> } {
  return { params: Promise.resolve(params) };
}

/**
 * Test-only boundary: envelope shapes are asserted field-by-field by the
 * expectations below, so one typed read per response keeps assertions honest
 * without re-declaring the wire shape at every call site.
 */
async function parseJson<T>(res: Response): Promise<T> {
  return (await res.json()) as T;
}

async function signUpWithRole(label: string, role: string | null) {
  const email = `d4-${label}-${RUN_ID}@example.test`;
  const username = `d4-${label}-${RUN_ID}`;

  const res = await auth.handler(
    new Request("http://localhost:3000/api/auth/sign-up/email", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": testIp() },
      body: JSON.stringify({ email, password: PASSWORD, name: `Awards D4 ${label}`, username }),
    }),
  );
  const body = await parseJson<{ user?: { id: string } }>(res);
  if (!res.ok || !body.user) {
    throw new Error(`sign-up failed for ${label}: ${res.status}`);
  }
  userIds.push(body.user.id);

  let cookie = res.headers
    .getSetCookie()
    .map((c) => c.split(";")[0])
    .join("; ");

  if (role) {
    await db.update(user).set({ role }).where(eq(user.id, body.user.id));
    // Fresh session so the new role is definitely visible to getSession.
    const signIn = await auth.handler(
      new Request("http://localhost:3000/api/auth/sign-in/email", {
        method: "POST",
        headers: { "content-type": "application/json", "x-forwarded-for": testIp() },
        body: JSON.stringify({ email, password: PASSWORD }),
      }),
    );
    if (!signIn.ok) throw new Error(`sign-in failed for ${label}: ${signIn.status}`);
    cookie = signIn.headers
      .getSetCookie()
      .map((c) => c.split(";")[0])
      .join("; ");
  }

  return { userId: body.user.id, email, cookie };
}

function programPayload(suffix: string, overrides: Record<string, unknown> = {}) {
  return {
    name: `d4-program-${suffix}-${RUN_ID}`,
    description: `Test award program ${suffix} created by the D4 integration suite (${RUN_ID}).`,
    status: "open",
    category: "achievement",
    criteria: ["Open to all members", "Work must be published in the last 12 months"],
    openDate: "2026-01-01T00:00:00.000Z",
    closeDate: "2026-06-30T23:59:59.000Z",
    awardDate: "2026-09-15T00:00:00.000Z",
    ...overrides,
  };
}

function nominationPayload(
  programId: string,
  suffix: string,
  overrides: Record<string, unknown> = {},
) {
  return {
    programId,
    nomineeName: `d4-nominee-${suffix}-${RUN_ID}`,
    nomineeEmail: `d4-nominee-${suffix}-${RUN_ID}@example.test`,
    nominatorName: `d4-nominator-${suffix}-${RUN_ID}`,
    nominatorEmail: `d4-nominator-${suffix}-${RUN_ID}@example.test`,
    statement: `Supporting statement for nomination ${suffix} (${RUN_ID}).`,
    ...overrides,
  };
}

let admin = { userId: "", email: "", cookie: "" };
let staff = { userId: "", email: "", cookie: "" };
let member = { userId: "", email: "", cookie: "" };

beforeAll(async () => {
  [admin, staff, member] = await Promise.all([
    signUpWithRole("admin", "admin"),
    signUpWithRole("staff", "staff"),
    signUpWithRole("member", "member"),
  ]);
});

afterAll(async () => {
  // Programs cascade their nominations; users go last. The name sweeps catch
  // anything an assertion-aborted test left behind.
  if (programIds.length > 0) {
    await db.delete(awardProgram).where(inArray(awardProgram.id, programIds));
  }
  await db.delete(awardNomination).where(like(awardNomination.nomineeName, `%${RUN_ID}%`));
  await db.delete(awardProgram).where(like(awardProgram.name, `%${RUN_ID}%`));
  if (userIds.length > 0) {
    await db.delete(user).where(inArray(user.id, userIds));
  }
});

// ---------------------------------------------------------------------------
// Authentication & RBAC
// ---------------------------------------------------------------------------

describe("awards authentication and RBAC", () => {
  test("listing and creating programs require authentication and awards permissions", async () => {
    expect((await listPrograms(buildRequest(PROGRAMS_API))).status).toBe(401);
    expect((await listPrograms(buildRequest(PROGRAMS_API, { cookie: member.cookie }))).status).toBe(
      403,
    );

    expect(
      (
        await createProgram(
          buildRequest(PROGRAMS_API, { method: "POST", body: programPayload("anon") }),
        )
      ).status,
    ).toBe(401);
    expect(
      (
        await createProgram(
          buildRequest(PROGRAMS_API, {
            method: "POST",
            cookie: member.cookie,
            body: programPayload("m"),
          }),
        )
      ).status,
    ).toBe(403);
    // staff holds awards:read/update/manage but not awards:create
    expect(
      (
        await createProgram(
          buildRequest(PROGRAMS_API, {
            method: "POST",
            cookie: staff.cookie,
            body: programPayload("s"),
          }),
        )
      ).status,
    ).toBe(403);
  });

  test("listing and creating nominations require authentication and awards permissions", async () => {
    expect((await listNominations(buildRequest(NOMINATIONS_API))).status).toBe(401);
    expect(
      (await listNominations(buildRequest(NOMINATIONS_API, { cookie: member.cookie }))).status,
    ).toBe(403);

    const missing = "00000000-0000-4000-8000-000000000000";
    expect(
      (
        await createNomination(
          buildRequest(NOMINATIONS_API, {
            method: "POST",
            body: nominationPayload(missing, "anon"),
          }),
        )
      ).status,
    ).toBe(401);
    expect(
      (
        await createNomination(
          buildRequest(NOMINATIONS_API, {
            method: "POST",
            cookie: member.cookie,
            body: nominationPayload(missing, "m"),
          }),
        )
      ).status,
    ).toBe(403);
  });

  test("item reads require awards:read", async () => {
    const missing = "00000000-0000-4000-8000-000000000000";
    expect(
      (await getProgram(buildRequest(`${PROGRAMS_API}/${missing}`), ctx({ id: missing }))).status,
    ).toBe(401);
    expect(
      (
        await getProgram(
          buildRequest(`${PROGRAMS_API}/${missing}`, { cookie: member.cookie }),
          ctx({ id: missing }),
        )
      ).status,
    ).toBe(403);
    expect(
      (
        await getNomination(
          buildRequest(`${NOMINATIONS_API}/${missing}`, { cookie: member.cookie }),
          ctx({ id: missing }),
        )
      ).status,
    ).toBe(403);
  });

  test("staff can read and update but not delete", async () => {
    const missing = "00000000-0000-4000-8000-000000000000";
    expect(
      (
        await deleteProgram(
          buildRequest(`${PROGRAMS_API}/${missing}`, { cookie: staff.cookie }),
          ctx({ id: missing }),
        )
      ).status,
    ).toBe(403);
    expect(
      (
        await deleteNomination(
          buildRequest(`${NOMINATIONS_API}/${missing}`, { cookie: staff.cookie }),
          ctx({ id: missing }),
        )
      ).status,
    ).toBe(403);
    // PATCH reaches the service layer (404, not 403) — staff holds awards:update.
    expect(
      (
        await updateProgram(
          buildRequest(`${PROGRAMS_API}/${missing}`, {
            method: "PATCH",
            cookie: staff.cookie,
            body: { status: "closed" },
          }),
          ctx({ id: missing }),
        )
      ).status,
    ).toBe(404);
    expect(
      (
        await updateNomination(
          buildRequest(`${NOMINATIONS_API}/${missing}`, {
            method: "PATCH",
            cookie: member.cookie,
            body: { status: "approved" },
          }),
          ctx({ id: missing }),
        )
      ).status,
    ).toBe(403);
  });
});

// ---------------------------------------------------------------------------
// Create programs
// ---------------------------------------------------------------------------

describe("award program creation", () => {
  test("create validates the payload", async () => {
    const empty = await createProgram(
      buildRequest(PROGRAMS_API, { method: "POST", cookie: admin.cookie, body: {} }),
    );
    expect(empty.status).toBe(422);

    const badStatus = await createProgram(
      buildRequest(PROGRAMS_API, {
        method: "POST",
        cookie: admin.cookie,
        body: programPayload("bad", { status: "dormant" }),
      }),
    );
    expect(badStatus.status).toBe(422);

    const badCategory = await createProgram(
      buildRequest(PROGRAMS_API, {
        method: "POST",
        cookie: admin.cookie,
        body: programPayload("bad", { category: "misc" }),
      }),
    );
    expect(badCategory.status).toBe(422);

    const shortName = await createProgram(
      buildRequest(PROGRAMS_API, {
        method: "POST",
        cookie: admin.cookie,
        body: programPayload("short", { name: "ab" }),
      }),
    );
    expect(shortName.status).toBe(422);

    // openDate after closeDate is an invalid nomination window
    const badWindow = await createProgram(
      buildRequest(PROGRAMS_API, {
        method: "POST",
        cookie: admin.cookie,
        body: programPayload("window", {
          openDate: "2026-07-01T00:00:00.000Z",
          closeDate: "2026-01-01T00:00:00.000Z",
        }),
      }),
    );
    expect(badWindow.status).toBe(422);
  });

  test("admin creates a program and the envelope carries the full UI shape", async () => {
    const res = await createProgram(
      buildRequest(PROGRAMS_API, {
        method: "POST",
        cookie: admin.cookie,
        body: programPayload("alpha"),
      }),
    );
    expect(res.status).toBe(201);

    const envelope = await parseJson<{ data: WireProgram }>(res);
    const created = envelope.data;
    programIds.push(created.id);
    state.alphaId = created.id;

    expect(created.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(created.name).toBe(`d4-program-alpha-${RUN_ID}`);
    expect(created.status).toBe("open");
    expect(created.category).toBe("achievement");
    expect(created.criteria).toEqual([
      "Open to all members",
      "Work must be published in the last 12 months",
    ]);
    expect(created.openDate).toBe("2026-01-01T00:00:00.000Z");
    expect(created.closeDate).toBe("2026-06-30T23:59:59.000Z");
    expect(created.awardDate).toBe("2026-09-15T00:00:00.000Z");
    expect(created.nominationCount).toBe(0);
    expect(created.createdBy).toBe(admin.email);
  });

  test("duplicate name is rejected with a conflict", async () => {
    const res = await createProgram(
      buildRequest(PROGRAMS_API, {
        method: "POST",
        cookie: admin.cookie,
        body: programPayload("alpha"),
      }),
    );
    expect(res.status).toBe(409);
    const body = await parseJson<{ data?: unknown }>(res);
    // RFC 9457 problem document, not the success envelope
    expect(body.data).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// List programs: envelope, filters, search, pagination (baseline-delta)
// ---------------------------------------------------------------------------

describe("award program listing", () => {
  beforeAll(async () => {
    // Seed two more programs with distinct statuses/categories for filters.
    for (const [suffix, status, category] of [
      ["beta", "draft", "scholarship"],
      ["gamma", "closed", "service"],
    ] as const) {
      const res = await createProgram(
        buildRequest(PROGRAMS_API, {
          method: "POST",
          cookie: admin.cookie,
          body: programPayload(suffix, { status, category }),
        }),
      );
      const envelope = await parseJson<{ data: WireProgram }>(res);
      programIds.push(envelope.data.id);
      state[`${suffix}Id`] = envelope.data.id;
    }
  });

  test("list returns the envelope with meta for the RUN_ID delta", async () => {
    const res = await listPrograms(
      buildRequest(`${PROGRAMS_API}?search=${RUN_ID}&limit=100`, { cookie: admin.cookie }),
    );
    expect(res.status).toBe(200);

    const envelope = await parseJson<{ data: WireProgram[]; meta: ListMeta }>(res);
    expect(Array.isArray(envelope.data)).toBe(true);
    // Baseline delta: nothing matched RUN_ID before this run created rows.
    expect(envelope.data.length).toBe(3);
    expect(envelope.meta.page).toBe(1);
    expect(envelope.meta.limit).toBe(100);
    expect(envelope.meta.total).toBe(3);
    expect(envelope.meta.totalPages).toBe(1);

    const names = envelope.data.map((row) => row.name).sort();
    expect(names).toEqual([
      `d4-program-alpha-${RUN_ID}`,
      `d4-program-beta-${RUN_ID}`,
      `d4-program-gamma-${RUN_ID}`,
    ]);
  });

  test("status filter narrows the delta (csv supported)", async () => {
    const res = await listPrograms(
      buildRequest(`${PROGRAMS_API}?search=${RUN_ID}&status=draft,closed`, {
        cookie: admin.cookie,
      }),
    );
    const envelope = await parseJson<{ data: WireProgram[] }>(res);
    expect(envelope.data.length).toBe(2);
    const statuses = envelope.data.map((row) => row.status).sort();
    expect(statuses).toEqual(["closed", "draft"]);
  });

  test("category filter narrows the delta", async () => {
    const res = await listPrograms(
      buildRequest(`${PROGRAMS_API}?search=${RUN_ID}&category=scholarship`, {
        cookie: admin.cookie,
      }),
    );
    const envelope = await parseJson<{ data: WireProgram[] }>(res);
    expect(envelope.data.length).toBe(1);
    expect(envelope.data[0].category).toBe("scholarship");

    const miss = await listPrograms(
      buildRequest(`${PROGRAMS_API}?search=${RUN_ID}&category=innovation`, {
        cookie: admin.cookie,
      }),
    );
    expect((await parseJson<{ data: WireProgram[] }>(miss)).data.length).toBe(0);
  });

  test("pagination slices the delta", async () => {
    const res = await listPrograms(
      buildRequest(`${PROGRAMS_API}?search=${RUN_ID}&limit=2&page=1`, { cookie: admin.cookie }),
    );
    const envelope = await parseJson<{ data: WireProgram[]; meta: ListMeta }>(res);
    expect(envelope.data.length).toBe(2);
    expect(envelope.meta.limit).toBe(2);
    expect(envelope.meta.total).toBe(3);
    expect(envelope.meta.totalPages).toBe(2);

    const pageTwo = await parseJson<{ data: WireProgram[]; meta: ListMeta }>(
      await listPrograms(
        buildRequest(`${PROGRAMS_API}?search=${RUN_ID}&limit=2&page=2`, { cookie: admin.cookie }),
      ),
    );
    expect(pageTwo.data.length).toBe(1);
  });

  test("staff can list programs", async () => {
    const res = await listPrograms(
      buildRequest(`${PROGRAMS_API}?search=${RUN_ID}`, { cookie: staff.cookie }),
    );
    expect(res.status).toBe(200);
    expect((await parseJson<{ data: WireProgram[] }>(res)).data.length).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// Nominations: create, validate, review (PATCH status)
// ---------------------------------------------------------------------------

describe("award nominations", () => {
  test("create validates the payload", async () => {
    const empty = await createNomination(
      buildRequest(NOMINATIONS_API, { method: "POST", cookie: admin.cookie, body: {} }),
    );
    expect(empty.status).toBe(422);

    const badEmail = await createNomination(
      buildRequest(NOMINATIONS_API, {
        method: "POST",
        cookie: admin.cookie,
        body: nominationPayload(state.alphaId, "bad", { nomineeEmail: "not-an-email" }),
      }),
    );
    expect(badEmail.status).toBe(422);

    const missingName = await createNomination(
      buildRequest(NOMINATIONS_API, {
        method: "POST",
        cookie: admin.cookie,
        body: nominationPayload(state.alphaId, "bad", { nomineeName: "" }),
      }),
    );
    expect(missingName.status).toBe(422);
  });

  test("unknown program and unknown user are validation errors", async () => {
    const missing = "00000000-0000-4000-8000-000000000000";

    const unknownProgram = await createNomination(
      buildRequest(NOMINATIONS_API, {
        method: "POST",
        cookie: admin.cookie,
        body: nominationPayload(missing, "orphan"),
      }),
    );
    expect(unknownProgram.status).toBe(422);
    const programBody = await parseJson<{ errors?: ValidationIssue[] }>(unknownProgram);
    expect(programBody.errors?.some((issue) => issue.field === "programId")).toBe(true);

    const unknownUser = await createNomination(
      buildRequest(NOMINATIONS_API, {
        method: "POST",
        cookie: admin.cookie,
        body: nominationPayload(state.alphaId, "ghost", { userId: missing }),
      }),
    );
    expect(unknownUser.status).toBe(422);
    const userBody = await parseJson<{ errors?: ValidationIssue[] }>(unknownUser);
    expect(userBody.errors?.some((issue) => issue.field === "userId")).toBe(true);
  });

  test("admin creates nominations and the envelope carries the UI shape", async () => {
    for (const suffix of ["one", "two", "three"] as const) {
      const res = await createNomination(
        buildRequest(NOMINATIONS_API, {
          method: "POST",
          cookie: admin.cookie,
          body: nominationPayload(state.alphaId, suffix),
        }),
      );
      expect(res.status).toBe(201);

      const envelope = await parseJson<{ data: WireNomination }>(res);
      const created = envelope.data;
      state[`nomination${suffix}Id`] = created.id;

      expect(created.id).toMatch(/^[0-9a-f-]{36}$/);
      expect(created.programId).toBe(state.alphaId);
      expect(created.programName).toBe(`d4-program-alpha-${RUN_ID}`);
      expect(created.status).toBe("pending");
      expect(created.nomineeName).toBe(`d4-nominee-${suffix}-${RUN_ID}`);
      expect(created.statement).toContain(RUN_ID);
      expect(created.createdBy).toBe(admin.email);
    }
  });

  test("nomination list filters by program, status, and search", async () => {
    // Baseline delta on nominee names containing RUN_ID.
    const all = await parseJson<{ data: WireNomination[]; meta: ListMeta }>(
      await listNominations(
        buildRequest(`${NOMINATIONS_API}?search=${RUN_ID}&limit=100`, { cookie: admin.cookie }),
      ),
    );
    expect(all.data.length).toBe(3);
    expect(all.meta.total).toBe(3);

    const byProgram = await parseJson<{ data: WireNomination[] }>(
      await listNominations(
        buildRequest(`${NOMINATIONS_API}?programId=${state.alphaId}&search=${RUN_ID}`, {
          cookie: admin.cookie,
        }),
      ),
    );
    expect(byProgram.data.length).toBe(3);

    const missProgram = await parseJson<{ data: WireNomination[] }>(
      await listNominations(
        buildRequest(`${NOMINATIONS_API}?programId=${state.betaId}&search=${RUN_ID}`, {
          cookie: admin.cookie,
        }),
      ),
    );
    expect(missProgram.data.length).toBe(0);

    const byNominee = await parseJson<{ data: WireNomination[] }>(
      await listNominations(
        buildRequest(`${NOMINATIONS_API}?search=d4-nominee-two-${RUN_ID}`, {
          cookie: admin.cookie,
        }),
      ),
    );
    expect(byNominee.data.length).toBe(1);
    expect(byNominee.data[0].nomineeName).toBe(`d4-nominee-two-${RUN_ID}`);
  });

  test("PATCH walks the review lifecycle and validates payloads", async () => {
    const emptyBody = await updateNomination(
      buildRequest(NOMINATIONS_API + "/" + state.nominationoneId, {
        method: "PATCH",
        cookie: admin.cookie,
        body: {},
      }),
      ctx({ id: state.nominationoneId }),
    );
    expect(emptyBody.status).toBe(422);

    const badStatus = await updateNomination(
      buildRequest(NOMINATIONS_API + "/" + state.nominationoneId, {
        method: "PATCH",
        cookie: admin.cookie,
        body: { status: "celebrated" },
      }),
      ctx({ id: state.nominationoneId }),
    );
    expect(badStatus.status).toBe(422);

    // pending → under_review → approved
    const toReview = await updateNomination(
      buildRequest(NOMINATIONS_API + "/" + state.nominationoneId, {
        method: "PATCH",
        cookie: admin.cookie,
        body: { status: "under_review" },
      }),
      ctx({ id: state.nominationoneId }),
    );
    expect(toReview.status).toBe(200);
    expect((await parseJson<{ data: WireNomination }>(toReview)).data.status).toBe("under_review");

    const approve = await updateNomination(
      buildRequest(NOMINATIONS_API + "/" + state.nominationoneId, {
        method: "PATCH",
        cookie: admin.cookie,
        body: { status: "approved" },
      }),
      ctx({ id: state.nominationoneId }),
    );
    expect(approve.status).toBe(200);
    const approvedBody = await parseJson<{ data: WireNomination }>(approve);
    expect(approvedBody.data.status).toBe("approved");
    expect(approvedBody.data.updatedBy).toBe(admin.email);

    // Reject nomination two; nomination three stays pending.
    const reject = await updateNomination(
      buildRequest(NOMINATIONS_API + "/" + state.nominationtwoId, {
        method: "PATCH",
        cookie: admin.cookie,
        body: { status: "rejected", statement: `Not eligible (${RUN_ID})` },
      }),
      ctx({ id: state.nominationtwoId }),
    );
    expect(reject.status).toBe(200);
    expect((await parseJson<{ data: WireNomination }>(reject)).data.statement).toBe(
      `Not eligible (${RUN_ID})`,
    );

    // Status filter sees the transitions.
    const approved = await parseJson<{ data: WireNomination[] }>(
      await listNominations(
        buildRequest(`${NOMINATIONS_API}?programId=${state.alphaId}&status=approved`, {
          cookie: admin.cookie,
        }),
      ),
    );
    expect(approved.data.length).toBe(1);
    expect(approved.data[0].status).toBe("approved");

    const pendingAndRejected = await parseJson<{ data: WireNomination[] }>(
      await listNominations(
        buildRequest(`${NOMINATIONS_API}?programId=${state.alphaId}&status=pending,rejected`, {
          cookie: admin.cookie,
        }),
      ),
    );
    expect(pendingAndRejected.data.length).toBe(2);
  });

  test("program nominationCount reflects its nominations", async () => {
    const res = await getProgram(
      buildRequest(`${PROGRAMS_API}/${state.alphaId}`, { cookie: admin.cookie }),
      ctx({ id: state.alphaId }),
    );
    expect(res.status).toBe(200);
    expect((await parseJson<{ data: WireProgram }>(res)).data.nominationCount).toBe(3);
  });

  test("get by id hydrates programName; unknown ids 404", async () => {
    const res = await getNomination(
      buildRequest(`${NOMINATIONS_API}/${state.nominationoneId}`, { cookie: admin.cookie }),
      ctx({ id: state.nominationoneId }),
    );
    expect(res.status).toBe(200);
    const body = await parseJson<{ data: WireNomination }>(res);
    expect(body.data.programName).toBe(`d4-program-alpha-${RUN_ID}`);
    expect(body.data.statement).toContain(RUN_ID);

    const missing = "00000000-0000-4000-8000-000000000000";
    expect(
      (await getNomination(buildRequest(`${NOMINATIONS_API}/${missing}`), ctx({ id: missing })))
        .status,
    ).toBe(401);
    expect(
      (
        await getNomination(
          buildRequest(`${NOMINATIONS_API}/${missing}`, { cookie: admin.cookie }),
          ctx({ id: missing }),
        )
      ).status,
    ).toBe(404);
  });

  test("delete nomination removes only that row", async () => {
    const res = await deleteNomination(
      buildRequest(`${NOMINATIONS_API}/${state.nominationthreeId}`, { cookie: admin.cookie }),
      ctx({ id: state.nominationthreeId }),
    );
    expect(res.status).toBe(200);
    expect((await parseJson<{ data: { id: string; deleted: boolean } }>(res)).data).toEqual({
      id: state.nominationthreeId,
      deleted: true,
    });

    expect(
      (
        await deleteNomination(
          buildRequest(`${NOMINATIONS_API}/${state.nominationthreeId}`, { cookie: admin.cookie }),
          ctx({ id: state.nominationthreeId }),
        )
      ).status,
    ).toBe(404);

    const alpha = await parseJson<{ data: WireProgram }>(
      await getProgram(
        buildRequest(`${PROGRAMS_API}/${state.alphaId}`, { cookie: admin.cookie }),
        ctx({ id: state.alphaId }),
      ),
    );
    expect(alpha.data.nominationCount).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// Read / update programs
// ---------------------------------------------------------------------------

describe("award program read and update", () => {
  test("unknown program is a 404", async () => {
    const missing = "00000000-0000-4000-8000-000000000000";
    expect(
      (
        await getProgram(
          buildRequest(`${PROGRAMS_API}/${missing}`, { cookie: admin.cookie }),
          ctx({ id: missing }),
        )
      ).status,
    ).toBe(404);
  });

  test("PATCH validates the payload", async () => {
    const empty = await updateProgram(
      buildRequest(`${PROGRAMS_API}/${state.betaId}`, {
        method: "PATCH",
        cookie: admin.cookie,
        body: {},
      }),
      ctx({ id: state.betaId }),
    );
    expect(empty.status).toBe(422);

    const badCategory = await updateProgram(
      buildRequest(`${PROGRAMS_API}/${state.betaId}`, {
        method: "PATCH",
        cookie: admin.cookie,
        body: { category: "misc" },
      }),
      ctx({ id: state.betaId }),
    );
    expect(badCategory.status).toBe(422);
  });

  test("PATCH updates fields and records updatedBy", async () => {
    const res = await updateProgram(
      buildRequest(`${PROGRAMS_API}/${state.betaId}`, {
        method: "PATCH",
        cookie: admin.cookie,
        body: {
          status: "open",
          category: "leadership",
          description: `Updated description (${RUN_ID})`,
          criteria: ["New criteria only"],
          awardDate: null,
        },
      }),
      ctx({ id: state.betaId }),
    );
    expect(res.status).toBe(200);

    const envelope = await parseJson<{ data: WireProgram }>(res);
    expect(envelope.data.status).toBe("open");
    expect(envelope.data.category).toBe("leadership");
    expect(envelope.data.description).toBe(`Updated description (${RUN_ID})`);
    expect(envelope.data.criteria).toEqual(["New criteria only"]);
    expect(envelope.data.awardDate).toBeUndefined();
    expect(envelope.data.updatedBy).toBe(admin.email);
    expect(envelope.data.name).toBe(`d4-program-beta-${RUN_ID}`);
  });

  test("PATCH into an existing name is a conflict", async () => {
    const res = await updateProgram(
      buildRequest(`${PROGRAMS_API}/${state.betaId}`, {
        method: "PATCH",
        cookie: admin.cookie,
        body: { name: `d4-program-alpha-${RUN_ID}` },
      }),
      ctx({ id: state.betaId }),
    );
    expect(res.status).toBe(409);
  });

  test("PATCH rejecting an inverted nomination window is a validation error", async () => {
    const res = await updateProgram(
      buildRequest(`${PROGRAMS_API}/${state.alphaId}`, {
        method: "PATCH",
        cookie: admin.cookie,
        body: { closeDate: "2025-12-31T23:59:59.000Z" },
      }),
      ctx({ id: state.alphaId }),
    );
    // alpha keeps openDate 2026-01-01; the patched closeDate would invert the window
    expect(res.status).toBe(422);
  });
});

// ---------------------------------------------------------------------------
// Delete: nomination cascade + 404 handling
// ---------------------------------------------------------------------------

describe("award program deletion", () => {
  test("deleting a program cascades its nominations", async () => {
    // Disposable program with one nomination.
    const created = await parseJson<{ data: WireProgram }>(
      await createProgram(
        buildRequest(PROGRAMS_API, {
          method: "POST",
          cookie: admin.cookie,
          body: programPayload("disposable", { status: "archived" }),
        }),
      ),
    );
    const disposableId = created.data.id;
    programIds.push(disposableId);

    const nomination = await parseJson<{ data: WireNomination }>(
      await createNomination(
        buildRequest(NOMINATIONS_API, {
          method: "POST",
          cookie: admin.cookie,
          body: nominationPayload(disposableId, "cascade"),
        }),
      ),
    );
    const nominationId = nomination.data.id;

    const res = await deleteProgram(
      buildRequest(`${PROGRAMS_API}/${disposableId}`, { cookie: admin.cookie }),
      ctx({ id: disposableId }),
    );
    expect(res.status).toBe(200);
    expect((await parseJson<{ data: { id: string; deleted: boolean } }>(res)).data).toEqual({
      id: disposableId,
      deleted: true,
    });

    // The nomination is gone with its parent.
    expect(await getAwardNominationDirect(nominationId)).toBeNull();
    expect(await getAwardProgramDirect(disposableId)).toBeNull();

    expect(
      (
        await deleteProgram(
          buildRequest(`${PROGRAMS_API}/${disposableId}`, { cookie: admin.cookie }),
          ctx({ id: disposableId }),
        )
      ).status,
    ).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// Service layer (direct)
// ---------------------------------------------------------------------------

describe("award service layer", () => {
  test("direct create/read/delete round-trip", async () => {
    const created = await createAwardProgramDirect(
      {
        name: `d4-program-direct-${RUN_ID}`,
        description: "Created directly through the service",
        category: "innovation",
        status: "draft",
        criteria: [],
      },
      admin.email,
    );
    programIds.push(created.id);
    expect(created.status).toBe("draft");
    expect(created.category).toBe("innovation");
    expect(created.nominationCount).toBe(0);

    const found = await getAwardProgramDirect(created.id);
    expect(found?.name).toBe(`d4-program-direct-${RUN_ID}`);

    expect(await deleteAwardProgramDirect(created.id)).toBe(true);
    expect(await deleteAwardProgramDirect(created.id)).toBe(false);
    expect(await getAwardProgramDirect(created.id)).toBeNull();
  });
});
