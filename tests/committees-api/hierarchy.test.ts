/**
 * D2 — Committees API integration tests: parent/child hierarchy.
 *
 * Covers the self-parent 409, parent/child linkage with subCommitteeIds,
 * the dangling-parent 400, and clearing a parent with "".
 *
 * Runs against the shared test database (DATABASE_URL from .env). Every row
 * this file creates is RUN_ID-isolated and removed in afterAll, so the file
 * is self-cleaning and safe to run alongside other test files.
 */

import { afterAll, beforeAll, describe, expect, test } from "bun:test";

import { POST as createCommittee } from "@/app/api/v1/committees/route";
import { GET as getCommittee, PATCH as updateCommittee } from "@/app/api/v1/committees/[id]/route";

import {
  API,
  buildRequest,
  cleanupCommitteesRun,
  committeePayload,
  createRegistry,
  parseEnvelope,
  seedCommittee,
  signUpWithRole,
  type Actor,
  type CommitteeWire,
} from "./fixtures";

const registry = createRegistry();

/** Values shared between ordered tests within this file. */
const state: Record<string, string> = {};

let admin: Actor = { userId: "", cookie: "" };

beforeAll(async () => {
  admin = await signUpWithRole(registry, "admin", "admin");
  // The self-parent check needs an existing committee to point at itself.
  const base = await seedCommittee(registry, admin);
  state.committeeId = base.id;
});

afterAll(async () => {
  await cleanupCommitteesRun(registry);
});

describe("committees hierarchy", () => {
  test("a committee cannot be its own parent", async () => {
    const res = await updateCommittee(
      buildRequest(`${API}/${state.committeeId}`, {
        method: "PATCH",
        cookie: admin.cookie,
        body: { parentCommitteeId: state.committeeId },
      }),
      { params: Promise.resolve({ id: state.committeeId }) },
    );
    expect(res.status).toBe(409);
  });

  test("parent/child linkage and dangling parent", async () => {
    const parentRes = await createCommittee(
      buildRequest(API, {
        method: "POST",
        cookie: admin.cookie,
        body: committeePayload(registry),
      }),
    );
    expect(parentRes.status).toBe(201);
    const { data: parent } = await parseEnvelope<CommitteeWire>(parentRes);
    state.parentId = parent.id;
    registry.committeeIds.push(parent.id);

    const childRes = await createCommittee(
      buildRequest(API, {
        method: "POST",
        cookie: admin.cookie,
        body: committeePayload(registry, { parentCommitteeId: parent.id }),
      }),
    );
    expect(childRes.status).toBe(201);
    const { data: child } = await parseEnvelope<CommitteeWire>(childRes);
    state.childId = child.id;
    registry.committeeIds.push(child.id);
    expect(child.parentCommitteeId).toBe(parent.id);

    const parentNow = await parseEnvelope<CommitteeWire>(
      await getCommittee(buildRequest(`${API}/${parent.id}`, { cookie: admin.cookie }), {
        params: Promise.resolve({ id: parent.id }),
      }),
    );
    expect(parentNow.data.subCommitteeIds).toContain(child.id);

    // dangling parent → business logic error (400)
    const dangling = await createCommittee(
      buildRequest(API, {
        method: "POST",
        cookie: admin.cookie,
        body: committeePayload(registry, { parentCommitteeId: crypto.randomUUID() }),
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
      { params: Promise.resolve({ id: child.id }) },
    );
    expect(cleared.status).toBe(200);
    expect((await parseEnvelope<CommitteeWire>(cleared)).data.parentCommitteeId).toBeUndefined();
  });
});
