/**
 * D1 — Chapters API integration tests.
 *
 * Covers the chapters CRUD surface end to end against the shared test
 * database (DATABASE_URL from .env):
 *
 * - authentication and per-action RBAC (admin full access, staff holds
 *   chapters:read/update/manage but not create/delete, member holds none),
 * - payload validation (422), duplicate-name conflicts (409),
 * - list filtering/search/pagination with the {data, meta} envelope,
 * - parent/child hierarchy (subChapterIds, clearing the parent),
 * - delete cascading chapter_members and set-nulling children,
 * - the service layer directly (get/update/delete semantics).
 *
 * Every row this file creates is name-isolated by RUN_ID and removed in
 * afterAll, so the suite is self-cleaning and safe to run alongside other
 * test files. List assertions filter by search=RUN_ID so they measure
 * exactly what this run adds (baseline delta).
 */

import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { eq, inArray, like } from "drizzle-orm";
import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db/client";
import { chapter, chapterMember, user } from "@/db/schema";
import { testIp } from "./helpers";

import { GET as listChapters, POST as createChapter } from "@/app/api/v1/chapters/route";
import {
  DELETE as deleteChapter,
  GET as getChapter,
  PATCH as updateChapter,
} from "@/app/api/v1/chapters/[id]/route";
import {
  createChapter as createChapterDirect,
  deleteChapter as deleteChapterDirect,
  getChapter as getChapterDirect,
  updateChapter as updateChapterDirect,
} from "@/lib/services/chapter.service";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const RUN_ID = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const PASSWORD = "Sup3r-Secret-Passw0rd!";
const API = "http://localhost:3000/api/v1/chapters";

const userIds: string[] = [];
const chapterIds: string[] = [];

/** Values shared between ordered tests within this file. */
const state: Record<string, string> = {};

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
  const email = `d1-${label}-${RUN_ID}@example.test`;
  const username = `d1-${label}-${RUN_ID}`;

  const res = await auth.handler(
    new Request("http://localhost:3000/api/auth/sign-up/email", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": testIp() },
      body: JSON.stringify({ email, password: PASSWORD, name: `Chapters D1 ${label}`, username }),
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

  return { userId: body.user.id, email, cookie };
}

function chapterPayload(suffix: string, overrides: Record<string, unknown> = {}) {
  return {
    name: `d1-chapter-${suffix}-${RUN_ID}`,
    displayName: `D1 ${suffix} Chapter ${RUN_ID}`,
    description: "A test chapter created by the D1 integration suite.",
    status: "active",
    location: {
      address: "1 Test Way",
      city: "Testville",
      state: "Testland",
      country: "Testonia",
      postalCode: "12345",
      coordinates: { latitude: 12.5, longitude: -45.25 },
      timezone: "UTC",
      region: `D1 Region ${RUN_ID}`,
    },
    contactInfo: {
      email: `chapter-${suffix}-${RUN_ID}@example.test`,
      phone: "+1 555 0100",
      website: "https://chapters.example.test",
      address: "1 Test Way, Testville",
    },
    socialMedia: { twitter: "" },
    settings: {
      allowOnlineRegistration: true,
      requireApproval: false,
      membershipDues: 25,
      meetingFrequency: "monthly",
      autoRenewMembership: false,
      sendReminders: true,
      publicDirectory: true,
    },
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
  // Chapters cascade their member rows; users go last. The name sweep
  // catches anything an assertion-aborted test left behind.
  if (chapterIds.length > 0) {
    await db.delete(chapter).where(inArray(chapter.id, chapterIds));
  }
  await db.delete(chapter).where(like(chapter.name, `%${RUN_ID}%`));
  if (userIds.length > 0) {
    await db.delete(user).where(inArray(user.id, userIds));
  }
});

// ---------------------------------------------------------------------------
// Authentication & RBAC
// ---------------------------------------------------------------------------

describe("chapters authentication and RBAC", () => {
  test("listing and creating require authentication and chapters permissions", async () => {
    expect((await listChapters(buildRequest(API))).status).toBe(401);
    expect((await listChapters(buildRequest(API, { cookie: member.cookie }))).status).toBe(403);

    expect(
      (await createChapter(buildRequest(API, { method: "POST", body: chapterPayload("anon") })))
        .status,
    ).toBe(401);
    expect(
      (
        await createChapter(
          buildRequest(API, { method: "POST", cookie: member.cookie, body: chapterPayload("m") }),
        )
      ).status,
    ).toBe(403);
    // staff holds chapters:read/update/manage but not chapters:create
    expect(
      (
        await createChapter(
          buildRequest(API, { method: "POST", cookie: staff.cookie, body: chapterPayload("s") }),
        )
      ).status,
    ).toBe(403);
  });

  test("item reads require chapters:read", async () => {
    const missing = "00000000-0000-4000-8000-000000000000";
    expect((await getChapter(buildRequest(`${API}/${missing}`), ctx({ id: missing }))).status).toBe(
      401,
    );
    expect(
      (
        await getChapter(
          buildRequest(`${API}/${missing}`, { cookie: member.cookie }),
          ctx({ id: missing }),
        )
      ).status,
    ).toBe(403);
  });
});

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

describe("chapter creation", () => {
  test("create validates the payload", async () => {
    const empty = await createChapter(
      buildRequest(API, { method: "POST", cookie: admin.cookie, body: {} }),
    );
    expect(empty.status).toBe(422);

    const badStatus = await createChapter(
      buildRequest(API, {
        method: "POST",
        cookie: admin.cookie,
        body: chapterPayload("bad", { status: "dormant" }),
      }),
    );
    expect(badStatus.status).toBe(422);

    const shortName = await createChapter(
      buildRequest(API, {
        method: "POST",
        cookie: admin.cookie,
        body: chapterPayload("short", { name: "ab" }),
      }),
    );
    expect(shortName.status).toBe(422);
  });

  test("admin creates a chapter and the envelope carries the full UI shape", async () => {
    const res = await createChapter(
      buildRequest(API, { method: "POST", cookie: admin.cookie, body: chapterPayload("alpha") }),
    );
    expect(res.status).toBe(201);

    const envelope = await parseEnvelope(res);
    const created = envelope.data;
    chapterIds.push(created.id);
    state.alphaId = created.id;

    expect(created.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(created.name).toBe(`d1-chapter-alpha-${RUN_ID}`);
    expect(created.displayName).toBe(`D1 alpha Chapter ${RUN_ID}`);
    expect(created.status).toBe("active");
    expect(created.location.city).toBe("Testville");
    expect(created.location.coordinates).toEqual({ latitude: 12.5, longitude: -45.25 });
    expect(created.leadership).toEqual([]);
    expect(created.memberCount).toBe(0);
    expect(created.subChapterIds).toEqual([]);
    expect(created.settings.membershipDues).toBe(25);
    expect(created.contactInfo.email).toBe(`chapter-alpha-${RUN_ID}@example.test`);
    expect(created.createdBy).toBe(admin.email);
    expect(typeof created.establishedDate).toBe("string");
    expect(created.metrics.engagementScore).toBe(0);
    expect(created.finances.totalRevenue).toBe(0);
  });

  test("duplicate name is rejected with a conflict", async () => {
    const res = await createChapter(
      buildRequest(API, { method: "POST", cookie: admin.cookie, body: chapterPayload("alpha") }),
    );
    expect(res.status).toBe(409);
    const body = await parseEnvelope(res);
    // RFC 9457 problem document, not the success envelope
    expect(body.data).toBeUndefined();
  });

  test("unknown parent chapter is a validation error", async () => {
    const res = await createChapter(
      buildRequest(API, {
        method: "POST",
        cookie: admin.cookie,
        body: chapterPayload("orphan", { parentChapterId: "00000000-0000-4000-8000-000000000000" }),
      }),
    );
    expect(res.status).toBe(422);
  });
});

// ---------------------------------------------------------------------------
// List: envelope, filters, search, pagination (baseline-delta via RUN_ID)
// ---------------------------------------------------------------------------

describe("chapter listing", () => {
  beforeAll(async () => {
    // Seed two more chapters with distinct statuses for filter assertions.
    for (const [suffix, status] of [
      ["beta", "pending"],
      ["gamma", "inactive"],
    ] as const) {
      const res = await createChapter(
        buildRequest(API, {
          method: "POST",
          cookie: admin.cookie,
          body: chapterPayload(suffix, { status }),
        }),
      );
      const envelope = await parseEnvelope(res);
      chapterIds.push(envelope.data.id);
      state[`${suffix}Id`] = envelope.data.id;
    }
  });

  test("list returns the envelope with meta for the RUN_ID delta", async () => {
    const res = await listChapters(
      buildRequest(`${API}?search=${RUN_ID}&limit=100`, { cookie: admin.cookie }),
    );
    expect(res.status).toBe(200);

    const envelope = await parseEnvelope(res);
    expect(Array.isArray(envelope.data)).toBe(true);
    // Baseline delta: nothing matched RUN_ID before this run created rows.
    expect(envelope.data.length).toBe(3);
    expect(envelope.meta.page).toBe(1);
    expect(envelope.meta.limit).toBe(100);
    expect(envelope.meta.total).toBe(3);
    expect(envelope.meta.totalPages).toBe(1);

    const names = envelope.data.map((row: any) => row.name).sort();
    expect(names).toEqual([
      `d1-chapter-alpha-${RUN_ID}`,
      `d1-chapter-beta-${RUN_ID}`,
      `d1-chapter-gamma-${RUN_ID}`,
    ]);
  });

  test("status filter narrows the delta", async () => {
    const res = await listChapters(
      buildRequest(`${API}?search=${RUN_ID}&status=pending`, { cookie: admin.cookie }),
    );
    const envelope = await parseEnvelope(res);
    expect(envelope.data.length).toBe(1);
    expect(envelope.data[0].status).toBe("pending");
  });

  test("region filter narrows the delta", async () => {
    const region = encodeURIComponent(`D1 Region ${RUN_ID}`);
    const res = await listChapters(
      buildRequest(`${API}?search=${RUN_ID}&region=${region}`, { cookie: admin.cookie }),
    );
    const envelope = await parseEnvelope(res);
    expect(envelope.data.length).toBe(3);

    const miss = await listChapters(
      buildRequest(`${API}?search=${RUN_ID}&region=${encodeURIComponent("Nowhere")}`, {
        cookie: admin.cookie,
      }),
    );
    expect((await parseEnvelope(miss)).data.length).toBe(0);
  });

  test("pagination slices the delta", async () => {
    const res = await listChapters(
      buildRequest(`${API}?search=${RUN_ID}&limit=2&page=1`, { cookie: admin.cookie }),
    );
    const envelope = await parseEnvelope(res);
    expect(envelope.data.length).toBe(2);
    expect(envelope.meta.limit).toBe(2);
    expect(envelope.meta.total).toBe(3);
    expect(envelope.meta.totalPages).toBe(2);

    const pageTwo = await parseEnvelope(
      await listChapters(
        buildRequest(`${API}?search=${RUN_ID}&limit=2&page=2`, { cookie: admin.cookie }),
      ),
    );
    expect(pageTwo.data.length).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// Read / update
// ---------------------------------------------------------------------------

describe("chapter read and update", () => {
  test("fetch one chapter by id", async () => {
    const res = await getChapter(
      buildRequest(`${API}/${state.alphaId}`, { cookie: staff.cookie }),
      ctx({ id: state.alphaId }),
    );
    expect(res.status).toBe(200);
    const envelope = await parseEnvelope(res);
    expect(envelope.data.id).toBe(state.alphaId);
    expect(envelope.data.leadership).toEqual([]);
  });

  test("unknown id is a 404", async () => {
    const missing = "00000000-0000-4000-8000-000000000000";
    expect(
      (
        await getChapter(
          buildRequest(`${API}/${missing}`, { cookie: admin.cookie }),
          ctx({ id: missing }),
        )
      ).status,
    ).toBe(404);
  });

  test("update requires chapters:update and a non-empty body", async () => {
    expect(
      (
        await updateChapter(
          buildRequest(`${API}/${state.alphaId}`, {
            method: "PATCH",
            cookie: member.cookie,
            body: { displayName: "nope" },
          }),
          ctx({ id: state.alphaId }),
        )
      ).status,
    ).toBe(403);

    expect(
      (
        await updateChapter(
          buildRequest(`${API}/${state.alphaId}`, {
            method: "PATCH",
            cookie: admin.cookie,
            body: {},
          }),
          ctx({ id: state.alphaId }),
        )
      ).status,
    ).toBe(422);

    const missing = "00000000-0000-4000-8000-000000000000";
    expect(
      (
        await updateChapter(
          buildRequest(`${API}/${missing}`, {
            method: "PATCH",
            cookie: admin.cookie,
            body: { displayName: "ghost" },
          }),
          ctx({ id: missing }),
        )
      ).status,
    ).toBe(404);
  });

  test("staff updates fields and the response reflects them", async () => {
    const res = await updateChapter(
      buildRequest(`${API}/${state.alphaId}`, {
        method: "PATCH",
        cookie: staff.cookie,
        body: {
          displayName: `D1 alpha renamed ${RUN_ID}`,
          status: "suspended",
          settings: {
            allowOnlineRegistration: false,
            requireApproval: true,
            membershipDues: 40,
            meetingFrequency: "quarterly",
            autoRenewMembership: true,
            sendReminders: false,
            publicDirectory: false,
          },
        },
      }),
      ctx({ id: state.alphaId }),
    );
    expect(res.status).toBe(200);
    const envelope = await parseEnvelope(res);
    expect(envelope.data.displayName).toBe(`D1 alpha renamed ${RUN_ID}`);
    expect(envelope.data.status).toBe("suspended");
    expect(envelope.data.settings.membershipDues).toBe(40);
    expect(envelope.data.updatedBy).toBe(staff.email);
  });

  test("renaming onto an existing name conflicts", async () => {
    const res = await updateChapter(
      buildRequest(`${API}/${state.betaId}`, {
        method: "PATCH",
        cookie: admin.cookie,
        body: { name: `d1-chapter-alpha-${RUN_ID}` },
      }),
      ctx({ id: state.betaId }),
    );
    expect(res.status).toBe(409);
  });
});

// ---------------------------------------------------------------------------
// Hierarchy: parent/child
// ---------------------------------------------------------------------------

describe("chapter hierarchy", () => {
  test("child links to parent and parent lists subChapterIds", async () => {
    const parentRes = await createChapter(
      buildRequest(API, { method: "POST", cookie: admin.cookie, body: chapterPayload("parent") }),
    );
    const parentEnvelope = await parseEnvelope(parentRes);
    chapterIds.push(parentEnvelope.data.id);
    state.parentId = parentEnvelope.data.id;

    const childRes = await createChapter(
      buildRequest(API, {
        method: "POST",
        cookie: admin.cookie,
        body: chapterPayload("child", { parentChapterId: state.parentId }),
      }),
    );
    expect(childRes.status).toBe(201);
    const childEnvelope = await parseEnvelope(childRes);
    chapterIds.push(childEnvelope.data.id);
    state.childId = childEnvelope.data.id;
    expect(childEnvelope.data.parentChapterId).toBe(state.parentId);

    const parentFetch = await parseEnvelope(
      await getChapter(
        buildRequest(`${API}/${state.parentId}`, { cookie: admin.cookie }),
        ctx({ id: state.parentId }),
      ),
    );
    expect(parentFetch.data.subChapterIds).toEqual([state.childId]);
  });

  test("a chapter cannot become its own parent", async () => {
    const res = await updateChapter(
      buildRequest(`${API}/${state.childId}`, {
        method: "PATCH",
        cookie: admin.cookie,
        body: { parentChapterId: state.childId },
      }),
      ctx({ id: state.childId }),
    );
    expect(res.status).toBe(422);
  });

  test("null clears the parent link", async () => {
    const res = await updateChapter(
      buildRequest(`${API}/${state.childId}`, {
        method: "PATCH",
        cookie: admin.cookie,
        body: { parentChapterId: null },
      }),
      ctx({ id: state.childId }),
    );
    expect(res.status).toBe(200);
    const envelope = await parseEnvelope(res);
    expect(envelope.data.parentChapterId ?? null).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Delete
// ---------------------------------------------------------------------------

describe("chapter deletion", () => {
  test("delete requires chapters:delete", async () => {
    expect(
      (
        await deleteChapter(
          buildRequest(`${API}/${state.gammaId}`, { method: "DELETE", cookie: member.cookie }),
          ctx({ id: state.gammaId }),
        )
      ).status,
    ).toBe(403);
    // staff holds read/update/manage but not delete
    expect(
      (
        await deleteChapter(
          buildRequest(`${API}/${state.gammaId}`, { method: "DELETE", cookie: staff.cookie }),
          ctx({ id: state.gammaId }),
        )
      ).status,
    ).toBe(403);
  });

  test("delete cascades chapter_members and set-nulls children", async () => {
    // Seed a member row directly — the API surface does not manage rosters yet.
    await db.insert(chapterMember).values({
      chapterId: state.gammaId,
      name: `D1 Officer ${RUN_ID}`,
      email: `officer-${RUN_ID}@example.test`,
      role: "TREASURER",
    });

    // Re-link the child to the parent we are about to delete.
    await updateChapter(
      buildRequest(`${API}/${state.childId}`, {
        method: "PATCH",
        cookie: admin.cookie,
        body: { parentChapterId: state.gammaId },
      }),
      ctx({ id: state.childId }),
    );

    const res = await deleteChapter(
      buildRequest(`${API}/${state.gammaId}`, { method: "DELETE", cookie: admin.cookie }),
      ctx({ id: state.gammaId }),
    );
    expect(res.status).toBe(200);
    const envelope = await parseEnvelope(res);
    expect(envelope.data).toEqual({ id: state.gammaId, deleted: true });

    const memberRows = await db
      .select()
      .from(chapterMember)
      .where(eq(chapterMember.chapterId, state.gammaId));
    expect(memberRows.length).toBe(0);

    const childFetch = await parseEnvelope(
      await getChapter(
        buildRequest(`${API}/${state.childId}`, { cookie: admin.cookie }),
        ctx({ id: state.childId }),
      ),
    );
    expect(childFetch.data.parentChapterId ?? null).toBeNull();

    expect(
      (
        await deleteChapter(
          buildRequest(`${API}/${state.gammaId}`, { method: "DELETE", cookie: admin.cookie }),
          ctx({ id: state.gammaId }),
        )
      ).status,
    ).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// Service layer (direct)
// ---------------------------------------------------------------------------

describe("chapter service layer", () => {
  test("create/get/update/delete round-trip", async () => {
    const created = await createChapterDirect(
      {
        name: `d1-chapter-svc-${RUN_ID}`,
        displayName: `D1 Service Chapter ${RUN_ID}`,
        status: "pending",
        parentChapterId: undefined,
        location: {
          address: "9 Service Lane",
          city: "Unitville",
          state: "Testland",
          country: "Testonia",
          postalCode: "54321",
          timezone: "UTC",
          region: `D1 Region ${RUN_ID}`,
        },
        contactInfo: { email: `svc-${RUN_ID}@example.test`, address: "9 Service Lane" },
        socialMedia: {},
        settings: {
          allowOnlineRegistration: false,
          requireApproval: false,
          membershipDues: 0,
          meetingFrequency: "weekly",
          autoRenewMembership: false,
          sendReminders: false,
          publicDirectory: false,
        },
        memberCount: 7,
        establishedDate: new Date("2020-01-15T00:00:00Z"),
      },
      "system:d1-test",
    );
    chapterIds.push(created.id);

    expect(created.memberCount).toBe(7);
    expect(created.establishedDate.toISOString()).toContain("2020-01-15");
    expect(created.createdBy).toBe("system:d1-test");

    const fetched = await getChapterDirect(created.id);
    expect(fetched?.name).toBe(created.name);

    const updated = await updateChapterDirect(created.id, { memberCount: 12 }, "system:d1-test");
    expect(updated.memberCount).toBe(12);

    expect(await deleteChapterDirect(created.id)).toBe(true);
    expect(await deleteChapterDirect(created.id)).toBe(false);
    expect(await getChapterDirect(created.id)).toBeNull();
  });

  test("unknown ids surface as null/false, not throws", async () => {
    const missing = "00000000-0000-4000-8000-000000000000";
    expect(await getChapterDirect(missing)).toBeNull();
    expect(await deleteChapterDirect(missing)).toBe(false);
  });
});
