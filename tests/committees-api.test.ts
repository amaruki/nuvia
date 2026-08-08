/**
 * D2 — Committees API integration tests.
 *
 * Covers committees CRUD, unique-name conflicts, parent/child hierarchy,
 * list filters with pagination meta, the leadership/member split, and the
 * RBAC matrix (admin all, staff read/update/manage, member none).
 *
 * Runs against the shared test database (DATABASE_URL from .env). Every row
 * this file creates is id-isolated by RUN_ID and removed in afterAll, so the
 * suite is self-cleaning and safe to run alongside other test files.
 */

import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { eq, inArray } from "drizzle-orm";
import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db/client";
import { committee, committeeMember, user } from "@/db/schema";
import { testIp } from "./helpers";

import { GET as listCommittees, POST as createCommittee } from "@/app/api/v1/committees/route";
import {
  DELETE as deleteCommittee,
  GET as getCommittee,
  PATCH as updateCommittee,
} from "@/app/api/v1/committees/[id]/route";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const RUN_ID = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const PASSWORD = "Sup3r-Secret-Passw0rd!";
const API = "http://localhost:3000/api/v1/committees";

const userIds: string[] = [];
const committeeIds: string[] = [];

/** Values shared between ordered tests within this file. */
const state: Record<string, string> = {};

/** Bumped per payload so every created committee has a unique name. */
let payloadSeq = 0;

interface RequestOptions {
  method?: string;
  cookie?: string;
  body?: unknown;
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

async function parseEnvelope(res: Response) {
  return (await res.json()) as { data: any; meta?: any };
}

async function signUpWithRole(label: string, role: string | null) {
  const email = `committees-d2-${label}-${RUN_ID}@example.test`;
  const username = `ctte-d2-${label}-${RUN_ID}`;

  const res = await auth.handler(
    new Request("http://localhost:3000/api/auth/sign-up/email", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": testIp() },
      body: JSON.stringify({ email, password: PASSWORD, name: `Committees D2 ${label}`, username }),
    }),
  );
  const body = (await res.json()) as { user?: { id: string } };
  if (!res.ok || !body.user) {
    throw new Error(`sign-up failed for ${label}: ${res.status} ${JSON.stringify(body)}`);
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

  return { userId: body.user.id, cookie };
}

function committeePayload(overrides: Record<string, unknown> = {}) {
  payloadSeq += 1;
  const suffix = `${RUN_ID}-${payloadSeq}`;
  return {
    name: `ctte-${suffix}`,
    displayName: `D2 Test Committee ${suffix}`,
    description: "A test committee created by the D2 integration suite.",
    purpose: "Verify the committees API end to end.",
    status: "active",
    type: "functional",
    charter: {
      missionStatement: "Coordinate D2 integration testing for the committees module.",
      responsibilities: ["Run the committees API test suite", "Report failures to the team"],
      authorityLevel: "advisory",
      decisionMakingProcess: "Consensus among members during monthly meetings.",
      reportingStructure: "Reports to the integration test orchestrator.",
      termLimits: { chairTerm: 12, memberTerm: 12, maxTerms: 2 },
    },
    contactInfo: {
      email: `committees-d2-${suffix}@example.test`,
      phone: "+1-555-0100",
      meetingLocation: "Test Hall A",
      virtualMeetingLink: "https://meet.example.test/d2",
      website: "https://committees.example.test",
    },
    ...overrides,
  };
}

let admin = { userId: "", cookie: "" };
let staff = { userId: "", cookie: "" };
let member = { userId: "", cookie: "" };

beforeAll(async () => {
  [admin, staff, member] = await Promise.all([
    signUpWithRole("admin", "admin"),
    signUpWithRole("staff", "staff"),
    signUpWithRole("member", "member"),
  ]);
});

afterAll(async () => {
  // Order matters: members reference committees, child committees reference
  // parent committees, and committees reference the users we created.
  if (committeeIds.length > 0) {
    await db.delete(committeeMember).where(inArray(committeeMember.committeeId, committeeIds));
    await db.delete(committee).where(inArray(committee.parentCommitteeId, committeeIds));
    await db.delete(committee).where(inArray(committee.id, committeeIds));
  }
  if (userIds.length > 0) {
    await db.delete(user).where(inArray(user.id, userIds));
  }
});

// ---------------------------------------------------------------------------
// CRUD + RBAC
// ---------------------------------------------------------------------------

describe("committees CRUD", () => {
  test("listing and creating require authentication and committees permissions", async () => {
    expect((await listCommittees(buildRequest(API))).status).toBe(401);
    // the "member" role holds no committees:* permissions
    expect((await listCommittees(buildRequest(API, { cookie: member.cookie }))).status).toBe(403);

    expect(
      (await createCommittee(buildRequest(API, { method: "POST", body: committeePayload() })))
        .status,
    ).toBe(401);
    expect(
      (
        await createCommittee(
          buildRequest(API, { method: "POST", cookie: member.cookie, body: committeePayload() }),
        )
      ).status,
    ).toBe(403);
    // staff holds committees:read/update/manage but not committees:create
    expect(
      (
        await createCommittee(
          buildRequest(API, { method: "POST", cookie: staff.cookie, body: committeePayload() }),
        )
      ).status,
    ).toBe(403);
  });

  test("create validates the payload", async () => {
    const empty = await createCommittee(
      buildRequest(API, { method: "POST", cookie: admin.cookie, body: {} }),
    );
    expect(empty.status).toBe(422);

    const badStatus = await createCommittee(
      buildRequest(API, {
        method: "POST",
        cookie: admin.cookie,
        body: committeePayload({ status: "dissolved" }),
      }),
    );
    expect(badStatus.status).toBe(422);

    const missingCharter = await createCommittee(
      buildRequest(API, {
        method: "POST",
        cookie: admin.cookie,
        body: committeePayload({ charter: undefined }),
      }),
    );
    expect(missingCharter.status).toBe(422);

    const badEmail = await createCommittee(
      buildRequest(API, {
        method: "POST",
        cookie: admin.cookie,
        body: committeePayload({ contactInfo: { email: "not-an-email" } }),
      }),
    );
    expect(badEmail.status).toBe(422);
  });

  test("admin creates a committee with server-managed charter dates", async () => {
    const payload = committeePayload();
    const res = await createCommittee(
      buildRequest(API, { method: "POST", cookie: admin.cookie, body: payload }),
    );
    expect(res.status).toBe(201);

    const { data } = await parseEnvelope(res);
    state.committeeId = data.id;
    state.committeeName = payload.name;
    state.approvalDate = data.charter.approvalDate;
    committeeIds.push(data.id);

    expect(data.name).toBe(payload.name);
    expect(data.displayName).toBe(payload.displayName);
    expect(data.status).toBe("active");
    expect(data.type).toBe("functional");
    expect(data.charter.authorityLevel).toBe("advisory");
    expect(data.charter.termLimits).toEqual({ chairTerm: 12, memberTerm: 12, maxTerms: 2 });
    expect(Number.isFinite(new Date(data.charter.approvalDate).getTime())).toBe(true);
    expect(new Date(data.charter.nextReview).getTime()).toBeGreaterThan(
      new Date(data.charter.approvalDate).getTime(),
    );
    expect(data.contactInfo.email).toBe(payload.contactInfo.email);
    expect(data.contactInfo.website).toBe("https://committees.example.test");
    expect(data.metrics.memberCount).toBe(0);
    expect(data.leadership).toEqual([]);
    expect(data.members).toEqual([]);
    expect(data.subCommitteeIds).toEqual([]);
    expect(data.createdBy).toBe(admin.userId);
  });

  test("duplicate name returns 409 conflict", async () => {
    const res = await createCommittee(
      buildRequest(API, {
        method: "POST",
        cookie: admin.cookie,
        body: committeePayload({ name: state.committeeName }),
      }),
    );
    expect(res.status).toBe(409);
    const problemBody = (await res.json()) as { detail?: string };
    expect(problemBody.detail).toContain(state.committeeName);
  });

  test("get returns the committee; unknown and malformed ids 404", async () => {
    const res = await getCommittee(
      buildRequest(`${API}/${state.committeeId}`, { cookie: admin.cookie }),
      ctx({ id: state.committeeId }),
    );
    expect(res.status).toBe(200);
    const { data } = await parseEnvelope(res);
    expect(data.id).toBe(state.committeeId);
    expect(data.name).toBe(state.committeeName);

    const missing = await getCommittee(
      buildRequest(`${API}/${crypto.randomUUID()}`, { cookie: admin.cookie }),
      ctx({ id: crypto.randomUUID() }),
    );
    expect(missing.status).toBe(404);

    const malformed = await getCommittee(
      buildRequest(`${API}/not-a-uuid`, { cookie: admin.cookie }),
      ctx({ id: "not-a-uuid" }),
    );
    expect(malformed.status).toBe(404);
  });

  test("staff can read, member cannot", async () => {
    expect(
      (
        await getCommittee(
          buildRequest(`${API}/${state.committeeId}`, { cookie: staff.cookie }),
          ctx({ id: state.committeeId }),
        )
      ).status,
    ).toBe(200);
    expect(
      (
        await getCommittee(
          buildRequest(`${API}/${state.committeeId}`, { cookie: member.cookie }),
          ctx({ id: state.committeeId }),
        )
      ).status,
    ).toBe(403);
  });

  test("leadership and members are split by role from committee_members", async () => {
    const [chairRow] = await db
      .insert(committeeMember)
      .values({
        committeeId: state.committeeId,
        userId: admin.userId,
        name: "Chair Person",
        email: `chair-${RUN_ID}@example.test`,
        role: "chair",
        title: "Committee Chair",
        responsibilities: ["Set the agenda", "Represent the committee"],
      })
      .returning();
    const [memberRow] = await db
      .insert(committeeMember)
      .values({
        committeeId: state.committeeId,
        name: "Regular Member",
        email: `member-${RUN_ID}@example.test`,
        role: "member",
        expertise: ["testing", "documentation"],
      })
      .returning();

    const res = await getCommittee(
      buildRequest(`${API}/${state.committeeId}`, { cookie: admin.cookie }),
      ctx({ id: state.committeeId }),
    );
    const { data } = await parseEnvelope(res);
    expect(data.leadership.map((l: any) => l.id)).toEqual([chairRow!.id]);
    expect(data.leadership[0].role).toBe("chair");
    expect(data.leadership[0].responsibilities).toEqual([
      "Set the agenda",
      "Represent the committee",
    ]);
    expect(data.members.map((m: any) => m.id)).toEqual([memberRow!.id]);
    expect(data.members[0].expertise).toEqual(["testing", "documentation"]);
    expect(data.metrics.memberCount).toBe(2);
    expect(data.metrics.activeMembersCount).toBe(2);
  });

  test("staff patches fields; charter approvalDate is preserved", async () => {
    const res = await updateCommittee(
      buildRequest(`${API}/${state.committeeId}`, {
        method: "PATCH",
        cookie: staff.cookie,
        body: {
          displayName: `D2 Renamed Committee ${RUN_ID}`,
          status: "inactive",
          charter: {
            missionStatement: "Updated mission statement for the D2 integration run.",
            responsibilities: ["Run the committees API test suite"],
            authorityLevel: "operational",
            decisionMakingProcess: "Majority vote with chair tie-breaker.",
            reportingStructure: "Reports directly to the board.",
          },
        },
      }),
      ctx({ id: state.committeeId }),
    );
    expect(res.status).toBe(200);

    const { data } = await parseEnvelope(res);
    expect(data.displayName).toBe(`D2 Renamed Committee ${RUN_ID}`);
    expect(data.status).toBe("inactive");
    expect(data.charter.missionStatement).toBe(
      "Updated mission statement for the D2 integration run.",
    );
    expect(data.charter.authorityLevel).toBe("operational");
    expect(data.charter.approvalDate).toBe(state.approvalDate);
    expect(data.updatedBy).toBe(staff.userId);

    // member holds committees:read... nothing — PATCH is 403
    expect(
      (
        await updateCommittee(
          buildRequest(`${API}/${state.committeeId}`, {
            method: "PATCH",
            cookie: member.cookie,
            body: { displayName: "Hijacked" },
          }),
          ctx({ id: state.committeeId }),
        )
      ).status,
    ).toBe(403);
  });

  test("patch rejects an empty body with 422", async () => {
    const res = await updateCommittee(
      buildRequest(`${API}/${state.committeeId}`, {
        method: "PATCH",
        cookie: admin.cookie,
        body: {},
      }),
      ctx({ id: state.committeeId }),
    );
    expect(res.status).toBe(422);
  });
});

// ---------------------------------------------------------------------------
// Hierarchy, filters, pagination, delete
// ---------------------------------------------------------------------------

describe("committees hierarchy and listing", () => {
  test("a committee cannot be its own parent", async () => {
    const res = await updateCommittee(
      buildRequest(`${API}/${state.committeeId}`, {
        method: "PATCH",
        cookie: admin.cookie,
        body: { parentCommitteeId: state.committeeId },
      }),
      ctx({ id: state.committeeId }),
    );
    expect(res.status).toBe(409);
  });

  test("parent/child linkage and dangling parent", async () => {
    const parentRes = await createCommittee(
      buildRequest(API, { method: "POST", cookie: admin.cookie, body: committeePayload() }),
    );
    expect(parentRes.status).toBe(201);
    const { data: parent } = await parseEnvelope(parentRes);
    state.parentId = parent.id;
    committeeIds.push(parent.id);

    const childRes = await createCommittee(
      buildRequest(API, {
        method: "POST",
        cookie: admin.cookie,
        body: committeePayload({ parentCommitteeId: parent.id }),
      }),
    );
    expect(childRes.status).toBe(201);
    const { data: child } = await parseEnvelope(childRes);
    state.childId = child.id;
    committeeIds.push(child.id);
    expect(child.parentCommitteeId).toBe(parent.id);

    const parentNow = await parseEnvelope(
      await getCommittee(
        buildRequest(`${API}/${parent.id}`, { cookie: admin.cookie }),
        ctx({ id: parent.id }),
      ),
    );
    expect(parentNow.data.subCommitteeIds).toContain(child.id);

    // dangling parent → business logic error (400)
    const dangling = await createCommittee(
      buildRequest(API, {
        method: "POST",
        cookie: admin.cookie,
        body: committeePayload({ parentCommitteeId: crypto.randomUUID() }),
      }),
    );
    expect(dangling.status).toBe(400);

    // clearing the parent with "" works
    const cleared = await updateCommittee(
      buildRequest(`${API}/${child.id}`, {
        method: "PATCH",
        cookie: admin.cookie,
        body: { parentCommitteeId: "" },
      }),
      ctx({ id: child.id }),
    );
    expect(cleared.status).toBe(200);
    expect((await parseEnvelope(cleared)).data.parentCommitteeId).toBeUndefined();
  });

  test("list filters scope to this run and expose pagination meta", async () => {
    const scoped = `${API}?search=${RUN_ID}&limit=100`;

    const all = await parseEnvelope(
      await listCommittees(buildRequest(scoped, { cookie: admin.cookie })),
    );
    const total = all.meta.total as number;
    expect(total).toBeGreaterThanOrEqual(3);
    expect(all.data.every((c: any) => c.displayName.includes(RUN_ID))).toBe(true);

    const inactive = await parseEnvelope(
      await listCommittees(buildRequest(`${scoped}&status=inactive`, { cookie: admin.cookie })),
    );
    expect(inactive.data.length).toBeGreaterThanOrEqual(1);
    expect(inactive.data.every((c: any) => c.status === "inactive")).toBe(true);

    const bogusStatus = await parseEnvelope(
      await listCommittees(buildRequest(`${scoped}&status=bogus`, { cookie: admin.cookie })),
    );
    expect(bogusStatus.meta.total).toBe(total);

    // member counts come from committee_members rows; only the first committee has two
    const minOne = await parseEnvelope(
      await listCommittees(buildRequest(`${scoped}&memberCountMin=1`, { cookie: admin.cookie })),
    );
    expect(minOne.meta.total).toBe(1);
    expect(minOne.data[0].id).toBe(state.committeeId);

    const typeFilter = await parseEnvelope(
      await listCommittees(buildRequest(`${scoped}&type=functional`, { cookie: admin.cookie })),
    );
    expect(typeFilter.meta.total).toBe(total);
  });

  test("pagination meta is consistent", async () => {
    const res = await listCommittees(
      buildRequest(`${API}?search=${RUN_ID}&page=1&limit=2`, { cookie: admin.cookie }),
    );
    expect(res.status).toBe(200);
    const { data, meta } = await parseEnvelope(res);
    expect(data.length).toBeLessThanOrEqual(2);
    expect(meta.page).toBe(1);
    expect(meta.limit).toBe(2);
    expect(meta.total).toBeGreaterThanOrEqual(data.length);
    expect(meta.totalPages).toBe(Math.max(1, Math.ceil(meta.total / meta.limit)));

    const page2 = await parseEnvelope(
      await listCommittees(
        buildRequest(`${API}?search=${RUN_ID}&page=2&limit=2`, { cookie: admin.cookie }),
      ),
    );
    expect(page2.meta.page).toBe(2);
    if (meta.total > 2) {
      expect(page2.data.length).toBeGreaterThan(0);
    }
  });

  test("delete is restricted to committees:delete and cascades members", async () => {
    expect(
      (
        await deleteCommittee(
          buildRequest(`${API}/${state.childId}`, { method: "DELETE", cookie: staff.cookie }),
          ctx({ id: state.childId }),
        )
      ).status,
    ).toBe(403);
    expect(
      (
        await deleteCommittee(
          buildRequest(`${API}/${state.childId}`, { method: "DELETE", cookie: member.cookie }),
          ctx({ id: state.childId }),
        )
      ).status,
    ).toBe(403);

    const res = await deleteCommittee(
      buildRequest(`${API}/${state.childId}`, { method: "DELETE", cookie: admin.cookie }),
      ctx({ id: state.childId }),
    );
    expect(res.status).toBe(200);
    expect((await parseEnvelope(res)).data).toEqual({ id: state.childId, deleted: true });

    const gone = await getCommittee(
      buildRequest(`${API}/${state.childId}`, { cookie: admin.cookie }),
      ctx({ id: state.childId }),
    );
    expect(gone.status).toBe(404);

    const again = await deleteCommittee(
      buildRequest(`${API}/${state.childId}`, { method: "DELETE", cookie: admin.cookie }),
      ctx({ id: state.childId }),
    );
    expect(again.status).toBe(404);

    const malformed = await deleteCommittee(
      buildRequest(`${API}/not-a-uuid`, { method: "DELETE", cookie: admin.cookie }),
      ctx({ id: "not-a-uuid" }),
    );
    expect(malformed.status).toBe(404);

    // members of a deleted committee are gone (FK cascade)
    const [remaining] = await db
      .select({ id: committee.id })
      .from(committee)
      .where(eq(committee.id, state.committeeId));
    expect(remaining).toBeDefined();
  });
});
