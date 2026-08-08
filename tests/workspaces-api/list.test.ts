/**
 * D5 — Workspaces API: listing — envelope, filters, search, pagination
 * (baseline-delta via RUN_ID).
 * Part of the split workspaces suite in tests/workspaces-api/.
 */

import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { workspace } from "@/db/schema";
import { GET as listWorkspaces, POST as createWorkspace } from "@/app/api/v1/workspaces/route";
import { API, buildRequest, createFixtures, parseEnvelope } from "./fixtures";

const { RUN_ID, state, workspaceIds, signUpWithRole, workspacePayload, seedCommittee, cleanup } =
  createFixtures();

let admin = { userId: "", email: "", cookie: "" };

beforeAll(async () => {
  admin = await signUpWithRole("admin", "admin");
  await seedCommittee(admin.userId);

  // alpha/delta mirror what the creation part produces: alpha plain, delta
  // project-typed and committee-linked.
  for (const [suffix, overrides] of [
    ["alpha", {}],
    ["delta", { type: "project", committeeId: state.committeeId }],
  ] as [string, Record<string, unknown>][]) {
    const res = await createWorkspace(
      buildRequest(API, {
        method: "POST",
        cookie: admin.cookie,
        body: workspacePayload(suffix, overrides),
      }),
    );
    const envelope = await parseEnvelope(res);
    workspaceIds.push(envelope.data.id);
    state[`${suffix}Id`] = envelope.data.id;
  }

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

afterAll(cleanup);

describe("workspace listing", () => {
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
