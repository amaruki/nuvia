/**
 * D5 — Workspaces API integration tests.
 *
 * Covers the workspaces CRUD surface end to end against the shared test
 * database (DATABASE_URL from .env):
 *
 * - authentication and per-action RBAC (admin full access; staff holds
 *   workspaces:read/update/manage but not create/delete; member_corporate
 *   holds read only; bare `member` holds none — even reads 403),
 * - payload validation (422), duplicate-name conflicts (409),
 * - committee linking (real committee id accepted, unknown id rejected),
 * - list filtering (status/type/memberRole/date range/search) and
 *   pagination with the {data, meta} envelope,
 * - the jsonb member-roster filter via a directly seeded roster,
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
import { committee, user, workspace } from "@/db/schema";
import { testIp } from "./helpers";

import { GET as listWorkspaces, POST as createWorkspace } from "@/app/api/v1/workspaces/route";
import {
  DELETE as deleteWorkspace,
  GET as getWorkspace,
  PATCH as updateWorkspace,
} from "@/app/api/v1/workspaces/[id]/route";
import {
  createWorkspace as createWorkspaceDirect,
  deleteWorkspace as deleteWorkspaceDirect,
  getWorkspace as getWorkspaceDirect,
  updateWorkspace as updateWorkspaceDirect,
  type WorkspaceSettingsInput,
} from "@/lib/services/workspace.service";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const RUN_ID = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const PASSWORD = "Sup3r-Secret-Passw0rd!";
const API = "http://localhost:3000/api/v1/workspaces";
const userIds: string[] = [];
const workspaceIds: string[] = [];
const committeeIds: string[] = [];

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
  const email = `d5-${label}-${RUN_ID}@example.test`;
  const username = `d5-${label}-${RUN_ID}`;

  const res = await auth.handler(
    new Request("http://localhost:3000/api/auth/sign-up/email", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": testIp() },
      body: JSON.stringify({ email, password: PASSWORD, name: `Workspaces D5 ${label}`, username }),
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

function settingsPayload(): WorkspaceSettingsInput {
  return {
    isPublic: false,
    allowGuestAccess: false,
    requireApproval: true,
    enableNotifications: true,
    autoArchiveDays: 365,
    maxFileSize: 50,
    allowedFileTypes: [".pdf", ".docx"],
    memberPermissions: [
      { role: "chair", permissions: ["view", "edit", "manage_members"] },
      { role: "member", permissions: ["view", "download"] },
    ],
  };
}

function workspacePayload(suffix: string, overrides: Record<string, unknown> = {}) {
  return {
    name: `d5-workspace-${suffix}-${RUN_ID}`,
    description: `D5 test workspace ${suffix}`,
    type: "general",
    settings: settingsPayload(),
    ...overrides,
  };
}

let admin = { userId: "", email: "", cookie: "" };
let staff = { userId: "", email: "", cookie: "" };
let member = { userId: "", email: "", cookie: "" };
let reader = { userId: "", email: "", cookie: "" };

beforeAll(async () => {
  [admin, staff, member, reader] = await Promise.all([
    signUpWithRole("admin", "admin"),
    signUpWithRole("staff", "staff"),
    signUpWithRole("member", "member"),
    signUpWithRole("reader", "member_corporate"),
  ]);

  // Fixture committee for the committee-link assertions.
  const [row] = await db
    .insert(committee)
    .values({
      name: `d5-committee-${RUN_ID}`,
      displayName: `D5 Committee ${RUN_ID}`,
      purpose: "Fixture committee for the D5 workspaces suite",
      contactEmail: `committee-${RUN_ID}@example.test`,
      createdBy: admin.userId,
    })
    .returning();
  committeeIds.push(row.id);
  state.committeeId = row.id;
});

afterAll(async () => {
  // The name sweep catches anything an assertion-aborted test left behind.
  if (workspaceIds.length > 0) {
    await db.delete(workspace).where(inArray(workspace.id, workspaceIds));
  }
  await db.delete(workspace).where(like(workspace.name, `%${RUN_ID}%`));
  if (committeeIds.length > 0) {
    await db.delete(committee).where(inArray(committee.id, committeeIds));
  }
  if (userIds.length > 0) {
    await db.delete(user).where(inArray(user.id, userIds));
  }
});

// ---------------------------------------------------------------------------
// Authentication & RBAC
// ---------------------------------------------------------------------------

describe("workspaces authentication and RBAC", () => {
  test("listing requires authentication and workspaces:read", async () => {
    expect((await listWorkspaces(buildRequest(API))).status).toBe(401);
    // Bare `member` holds no workspaces permissions — even reads are 403.
    expect((await listWorkspaces(buildRequest(API, { cookie: member.cookie }))).status).toBe(403);
    // member_corporate holds workspaces:read only.
    expect((await listWorkspaces(buildRequest(API, { cookie: reader.cookie }))).status).toBe(200);
    // staff holds workspaces:read/update/manage.
    expect((await listWorkspaces(buildRequest(API, { cookie: staff.cookie }))).status).toBe(200);
  });

  test("creating requires workspaces:create", async () => {
    expect(
      (await createWorkspace(buildRequest(API, { method: "POST", body: workspacePayload("anon") })))
        .status,
    ).toBe(401);
    expect(
      (
        await createWorkspace(
          buildRequest(API, { method: "POST", cookie: member.cookie, body: workspacePayload("m") }),
        )
      ).status,
    ).toBe(403);
    expect(
      (
        await createWorkspace(
          buildRequest(API, {
            method: "POST",
            cookie: reader.cookie,
            body: workspacePayload("r"),
          }),
        )
      ).status,
    ).toBe(403);
    // staff holds read/update/manage but not create
    expect(
      (
        await createWorkspace(
          buildRequest(API, { method: "POST", cookie: staff.cookie, body: workspacePayload("s") }),
        )
      ).status,
    ).toBe(403);
  });

  test("item reads require workspaces:read", async () => {
    const missing = "00000000-0000-4000-8000-000000000000";
    expect(
      (await getWorkspace(buildRequest(`${API}/${missing}`), ctx({ id: missing }))).status,
    ).toBe(401);
    expect(
      (
        await getWorkspace(
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

describe("workspace creation", () => {
  test("create validates the payload", async () => {
    const empty = await createWorkspace(
      buildRequest(API, { method: "POST", cookie: admin.cookie, body: {} }),
    );
    expect(empty.status).toBe(422);

    const badStatus = await createWorkspace(
      buildRequest(API, {
        method: "POST",
        cookie: admin.cookie,
        body: workspacePayload("bad", { status: "dormant" }),
      }),
    );
    expect(badStatus.status).toBe(422);

    const shortName = await createWorkspace(
      buildRequest(API, {
        method: "POST",
        cookie: admin.cookie,
        body: workspacePayload("short", { name: "ab" }),
      }),
    );
    expect(shortName.status).toBe(422);

    const missingSettings = await createWorkspace(
      buildRequest(API, {
        method: "POST",
        cookie: admin.cookie,
        body: workspacePayload("settings", { settings: undefined }),
      }),
    );
    expect(missingSettings.status).toBe(422);

    const zeroArchive = await createWorkspace(
      buildRequest(API, {
        method: "POST",
        cookie: admin.cookie,
        body: workspacePayload("archive", {
          settings: { ...settingsPayload(), autoArchiveDays: 0 },
        }),
      }),
    );
    expect(zeroArchive.status).toBe(422);

    const noPermissions = await createWorkspace(
      buildRequest(API, {
        method: "POST",
        cookie: admin.cookie,
        body: workspacePayload("perms", {
          settings: { ...settingsPayload(), memberPermissions: [] },
        }),
      }),
    );
    expect(noPermissions.status).toBe(422);
  });

  test("admin creates a workspace and the envelope carries the full UI shape", async () => {
    const res = await createWorkspace(
      buildRequest(API, { method: "POST", cookie: admin.cookie, body: workspacePayload("alpha") }),
    );
    expect(res.status).toBe(201);

    const envelope = await parseEnvelope(res);
    const created = envelope.data;
    workspaceIds.push(created.id);
    state.alphaId = created.id;

    expect(created.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(created.name).toBe(`d5-workspace-alpha-${RUN_ID}`);
    expect(created.description).toBe("D5 test workspace alpha");
    expect(created.type).toBe("general");
    expect(created.status).toBe("active");
    expect(created.committeeId).toBe("");
    expect(created.settings.autoArchiveDays).toBe(365);
    expect(created.settings.memberPermissions.length).toBe(2);
    // Collaboration collections start empty — roster/content management is
    // DB-only until a later backlog item.
    expect(created.members).toEqual([]);
    expect(created.documents).toEqual([]);
    expect(created.tasks).toEqual([]);
    expect(created.discussions).toEqual([]);
    expect(created.meetings).toEqual([]);
    expect(created.activity).toEqual([]);
    // Workspaces store the acting user's id (FK users.id), not an email.
    expect(created.createdBy).toBe(admin.userId);
    expect(created.updatedBy).toBe(admin.userId);
    expect(typeof created.createdAt).toBe("string");
    expect(typeof created.updatedAt).toBe("string");
  });

  test("duplicate name is rejected with a conflict", async () => {
    const res = await createWorkspace(
      buildRequest(API, { method: "POST", cookie: admin.cookie, body: workspacePayload("alpha") }),
    );
    expect(res.status).toBe(409);
    const body = await parseEnvelope(res);
    // RFC 9457 problem document, not the success envelope
    expect(body.data).toBeUndefined();
  });

  test("unknown committee is a validation error; a real committee links", async () => {
    const unknown = await createWorkspace(
      buildRequest(API, {
        method: "POST",
        cookie: admin.cookie,
        body: workspacePayload("orphan", { committeeId: "00000000-0000-4000-8000-000000000000" }),
      }),
    );
    expect(unknown.status).toBe(422);

    const linked = await createWorkspace(
      buildRequest(API, {
        method: "POST",
        cookie: admin.cookie,
        body: workspacePayload("delta", { type: "project", committeeId: state.committeeId }),
      }),
    );
    expect(linked.status).toBe(201);
    const envelope = await parseEnvelope(linked);
    workspaceIds.push(envelope.data.id);
    state.deltaId = envelope.data.id;
    expect(envelope.data.committeeId).toBe(state.committeeId);
  });
});

// ---------------------------------------------------------------------------
// List: envelope, filters, search, pagination (baseline-delta via RUN_ID)
// ---------------------------------------------------------------------------

describe("workspace listing", () => {
  beforeAll(async () => {
    // Seed two more workspaces with distinct status/type for filter asserts.
    for (const [suffix, status, type] of [
      ["beta", "archived", "document"],
      ["gamma", "locked", "meeting"],
    ] as const) {
      const res = await createWorkspace(
        buildRequest(API, {
          method: "POST",
          cookie: admin.cookie,
          body: workspacePayload(suffix, { status, type }),
        }),
      );
      const envelope = await parseEnvelope(res);
      workspaceIds.push(envelope.data.id);
      state[`${suffix}Id`] = envelope.data.id;
    }

    // Seed a roster entry directly on beta — the API surface does not manage
    // rosters yet, and the memberRole filter reads the members jsonb blob.
    await db
      .update(workspace)
      .set({
        members: [
          {
            id: `mem-${RUN_ID}`,
            userId: admin.userId,
            name: "D5 Chair",
            email: admin.email,
            role: "chair",
            permissions: ["view"],
            joinedAt: new Date().toISOString(),
            lastActiveAt: new Date().toISOString(),
            isActive: true,
          },
        ],
      })
      .where(eq(workspace.id, state.betaId));
  });

  test("list returns the envelope with meta for the RUN_ID delta", async () => {
    const res = await listWorkspaces(
      buildRequest(`${API}?search=${RUN_ID}&limit=100`, { cookie: admin.cookie }),
    );
    expect(res.status).toBe(200);

    const envelope = await parseEnvelope(res);
    expect(Array.isArray(envelope.data)).toBe(true);
    // Baseline delta: nothing matched RUN_ID before this run created rows.
    expect(envelope.data.length).toBe(4);
    expect(envelope.meta.page).toBe(1);
    expect(envelope.meta.limit).toBe(100);
    expect(envelope.meta.total).toBe(4);
    expect(envelope.meta.totalPages).toBe(1);

    const names = envelope.data.map((row: any) => row.name).sort();
    expect(names).toEqual([
      `d5-workspace-alpha-${RUN_ID}`,
      `d5-workspace-beta-${RUN_ID}`,
      `d5-workspace-delta-${RUN_ID}`,
      `d5-workspace-gamma-${RUN_ID}`,
    ]);
  });

  test("status filter narrows the delta", async () => {
    const res = await listWorkspaces(
      buildRequest(`${API}?search=${RUN_ID}&status=archived`, { cookie: admin.cookie }),
    );
    const envelope = await parseEnvelope(res);
    expect(envelope.data.length).toBe(1);
    expect(envelope.data[0].status).toBe("archived");

    const multi = await parseEnvelope(
      await listWorkspaces(
        buildRequest(`${API}?search=${RUN_ID}&status=archived,locked`, { cookie: admin.cookie }),
      ),
    );
    expect(multi.data.length).toBe(2);
  });

  test("type filter narrows the delta", async () => {
    const res = await listWorkspaces(
      buildRequest(`${API}?search=${RUN_ID}&type=document,meeting`, { cookie: admin.cookie }),
    );
    const envelope = await parseEnvelope(res);
    expect(envelope.data.length).toBe(2);
    const types = envelope.data.map((row: any) => row.type).sort();
    expect(types).toEqual(["document", "meeting"]);
  });

  test("memberRole filter matches the seeded roster", async () => {
    const res = await listWorkspaces(
      buildRequest(`${API}?search=${RUN_ID}&memberRole=chair`, { cookie: admin.cookie }),
    );
    const envelope = await parseEnvelope(res);
    expect(envelope.data.length).toBe(1);
    expect(envelope.data[0].id).toBe(state.betaId);
    expect(envelope.data[0].members.length).toBe(1);
    expect(envelope.data[0].members[0].role).toBe("chair");
  });

  test("date-range bounds the delta", async () => {
    const future = new Date(Date.now() + 86_400_000).toISOString();
    const none = await parseEnvelope(
      await listWorkspaces(
        buildRequest(`${API}?search=${RUN_ID}&createdAfter=${encodeURIComponent(future)}`, {
          cookie: admin.cookie,
        }),
      ),
    );
    expect(none.data.length).toBe(0);

    const all = await parseEnvelope(
      await listWorkspaces(
        buildRequest(`${API}?search=${RUN_ID}&createdBefore=${encodeURIComponent(future)}`, {
          cookie: admin.cookie,
        }),
      ),
    );
    expect(all.data.length).toBe(4);
  });

  test("search matches name and description", async () => {
    const exact = await parseEnvelope(
      await listWorkspaces(
        buildRequest(`${API}?search=d5-workspace-beta-${RUN_ID}`, { cookie: admin.cookie }),
      ),
    );
    expect(exact.data.length).toBe(1);
    expect(exact.data[0].id).toBe(state.betaId);
  });

  test("pagination slices the delta", async () => {
    const res = await listWorkspaces(
      buildRequest(`${API}?search=${RUN_ID}&limit=2&page=1`, { cookie: admin.cookie }),
    );
    const envelope = await parseEnvelope(res);
    expect(envelope.data.length).toBe(2);
    expect(envelope.meta.limit).toBe(2);
    expect(envelope.meta.total).toBe(4);
    expect(envelope.meta.totalPages).toBe(2);

    const pageTwo = await parseEnvelope(
      await listWorkspaces(
        buildRequest(`${API}?search=${RUN_ID}&limit=2&page=2`, { cookie: admin.cookie }),
      ),
    );
    expect(pageTwo.data.length).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// Read / update
// ---------------------------------------------------------------------------

describe("workspace read and update", () => {
  test("fetch one workspace by id", async () => {
    const res = await getWorkspace(
      buildRequest(`${API}/${state.alphaId}`, { cookie: staff.cookie }),
      ctx({ id: state.alphaId }),
    );
    expect(res.status).toBe(200);
    const envelope = await parseEnvelope(res);
    expect(envelope.data.id).toBe(state.alphaId);
    expect(envelope.data.members).toEqual([]);
  });

  test("unknown id is a 404", async () => {
    const missing = "00000000-0000-4000-8000-000000000000";
    expect(
      (
        await getWorkspace(
          buildRequest(`${API}/${missing}`, { cookie: admin.cookie }),
          ctx({ id: missing }),
        )
      ).status,
    ).toBe(404);
  });

  test("update requires workspaces:update and a non-empty body", async () => {
    expect(
      (
        await updateWorkspace(
          buildRequest(`${API}/${state.alphaId}`, {
            method: "PATCH",
            cookie: member.cookie,
            body: { description: "nope" },
          }),
          ctx({ id: state.alphaId }),
        )
      ).status,
    ).toBe(403);
    // member_corporate holds read only — no update
    expect(
      (
        await updateWorkspace(
          buildRequest(`${API}/${state.alphaId}`, {
            method: "PATCH",
            cookie: reader.cookie,
            body: { description: "nope" },
          }),
          ctx({ id: state.alphaId }),
        )
      ).status,
    ).toBe(403);

    expect(
      (
        await updateWorkspace(
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
        await updateWorkspace(
          buildRequest(`${API}/${missing}`, {
            method: "PATCH",
            cookie: admin.cookie,
            body: { description: "ghost" },
          }),
          ctx({ id: missing }),
        )
      ).status,
    ).toBe(404);
  });

  test("staff updates fields and the response reflects them", async () => {
    const res = await updateWorkspace(
      buildRequest(`${API}/${state.alphaId}`, {
        method: "PATCH",
        cookie: staff.cookie,
        body: {
          name: `d5-workspace-alpha-renamed-${RUN_ID}`,
          status: "locked",
          type: "project",
          settings: { ...settingsPayload(), maxFileSize: 100, requireApproval: false },
        },
      }),
      ctx({ id: state.alphaId }),
    );
    expect(res.status).toBe(200);
    const envelope = await parseEnvelope(res);
    expect(envelope.data.name).toBe(`d5-workspace-alpha-renamed-${RUN_ID}`);
    expect(envelope.data.status).toBe("locked");
    expect(envelope.data.type).toBe("project");
    expect(envelope.data.settings.maxFileSize).toBe(100);
    expect(envelope.data.settings.requireApproval).toBe(false);
    expect(envelope.data.updatedBy).toBe(staff.userId);
  });

  test("renaming onto an existing name conflicts", async () => {
    const res = await updateWorkspace(
      buildRequest(`${API}/${state.betaId}`, {
        method: "PATCH",
        cookie: admin.cookie,
        body: { name: `d5-workspace-alpha-renamed-${RUN_ID}` },
      }),
      ctx({ id: state.betaId }),
    );
    expect(res.status).toBe(409);
  });

  test("null clears the committee link", async () => {
    const res = await updateWorkspace(
      buildRequest(`${API}/${state.deltaId}`, {
        method: "PATCH",
        cookie: admin.cookie,
        body: { committeeId: null },
      }),
      ctx({ id: state.deltaId }),
    );
    expect(res.status).toBe(200);
    const envelope = await parseEnvelope(res);
    expect(envelope.data.committeeId).toBe("");
  });
});

// ---------------------------------------------------------------------------
// Delete
// ---------------------------------------------------------------------------

describe("workspace deletion", () => {
  test("delete requires workspaces:delete", async () => {
    expect(
      (
        await deleteWorkspace(
          buildRequest(`${API}/${state.gammaId}`, { method: "DELETE", cookie: member.cookie }),
          ctx({ id: state.gammaId }),
        )
      ).status,
    ).toBe(403);
    // staff holds read/update/manage but not delete
    expect(
      (
        await deleteWorkspace(
          buildRequest(`${API}/${state.gammaId}`, { method: "DELETE", cookie: staff.cookie }),
          ctx({ id: state.gammaId }),
        )
      ).status,
    ).toBe(403);
    // member_corporate holds read only
    expect(
      (
        await deleteWorkspace(
          buildRequest(`${API}/${state.gammaId}`, { method: "DELETE", cookie: reader.cookie }),
          ctx({ id: state.gammaId }),
        )
      ).status,
    ).toBe(403);
  });

  test("admin deletes and a second delete is a 404", async () => {
    const res = await deleteWorkspace(
      buildRequest(`${API}/${state.gammaId}`, { method: "DELETE", cookie: admin.cookie }),
      ctx({ id: state.gammaId }),
    );
    expect(res.status).toBe(200);
    const envelope = await parseEnvelope(res);
    expect(envelope.data).toEqual({ id: state.gammaId, deleted: true });

    expect(
      (
        await deleteWorkspace(
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

describe("workspace service layer", () => {
  test("create/get/update/delete round-trip", async () => {
    const created = await createWorkspaceDirect(
      {
        name: `d5-workspace-svc-${RUN_ID}`,
        description: "Service-layer workspace",
        type: "discussion",
        status: "archived",
        committeeId: undefined,
        settings: settingsPayload(),
      },
      admin.userId,
    );
    workspaceIds.push(created.id);

    expect(created.type).toBe("discussion");
    expect(created.status).toBe("archived");
    expect(created.committeeId).toBe("");
    expect(created.members).toEqual([]);
    // createdBy holds the acting user's id (FK users.id).
    expect(created.createdBy).toBe(admin.userId);
    expect(created.createdAt).toBeInstanceOf(Date);

    const fetched = await getWorkspaceDirect(created.id);
    expect(fetched?.name).toBe(created.name);

    const updated = await updateWorkspaceDirect(created.id, { status: "active" }, admin.userId);
    expect(updated.status).toBe("active");
    expect(updated.updatedBy).toBe(admin.userId);

    expect(await deleteWorkspaceDirect(created.id)).toBe(true);
    expect(await deleteWorkspaceDirect(created.id)).toBe(false);
    expect(await getWorkspaceDirect(created.id)).toBeNull();
  });

  test("unknown ids surface as null/false, not throws", async () => {
    const missing = "00000000-0000-4000-8000-000000000000";
    expect(await getWorkspaceDirect(missing)).toBeNull();
    expect(await deleteWorkspaceDirect(missing)).toBe(false);
  });
});
