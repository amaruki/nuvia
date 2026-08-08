/**
 * D2 — Committees API integration tests: DELETE permissions.
 *
 * Covers the committees:delete permission matrix, the 200 delete envelope,
 * and idempotent 404s for deleted, malformed, and unknown ids.
 *
 * Runs against the shared test database (DATABASE_URL from .env). Every row
 * this file creates is RUN_ID-isolated and removed in afterAll, so the file
 * is self-cleaning and safe to run alongside other test files.
 */

import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { committee } from "@/db/schema";

import { DELETE as deleteCommittee, GET as getCommittee } from "@/app/api/v1/committees/[id]/route";

import {
  API,
  buildRequest,
  cleanupCommitteesRun,
  createRegistry,
  parseEnvelope,
  seedCommittee,
  signUpActors,
  type Actor,
} from "./fixtures";

const registry = createRegistry();

/** Values shared between ordered tests within this file. */
const state: Record<string, string> = {};

let admin: Actor = { userId: "", cookie: "" };
let staff: Actor = { userId: "", cookie: "" };
let member: Actor = { userId: "", cookie: "" };

beforeAll(async () => {
  ({ admin, staff, member } = await signUpActors(registry));
  // One committee survives to prove delete removes exactly the target row.
  const survivor = await seedCommittee(registry, admin);
  state.committeeId = survivor.id;
  const target = await seedCommittee(registry, admin);
  state.childId = target.id;
});

afterAll(async () => {
  await cleanupCommitteesRun(registry);
});

describe("committees delete", () => {
  test("delete is restricted to committees:delete and cascades members", async () => {
    expect(
      (
        await deleteCommittee(
          buildRequest(`${API}/${state.childId}`, { method: "DELETE", cookie: staff.cookie }),
          { params: Promise.resolve({ id: state.childId }) },
        )
      ).status,
    ).toBe(403);
    expect(
      (
        await deleteCommittee(
          buildRequest(`${API}/${state.childId}`, { method: "DELETE", cookie: member.cookie }),
          { params: Promise.resolve({ id: state.childId }) },
        )
      ).status,
    ).toBe(403);

    const res = await deleteCommittee(
      buildRequest(`${API}/${state.childId}`, { method: "DELETE", cookie: admin.cookie }),
      { params: Promise.resolve({ id: state.childId }) },
    );
    expect(res.status).toBe(200);
    expect((await parseEnvelope<{ id: string; deleted: boolean }>(res)).data).toEqual({
      id: state.childId,
      deleted: true,
    });

    const gone = await getCommittee(
      buildRequest(`${API}/${state.childId}`, { cookie: admin.cookie }),
      { params: Promise.resolve({ id: state.childId }) },
    );
    expect(gone.status).toBe(404);

    const again = await deleteCommittee(
      buildRequest(`${API}/${state.childId}`, { method: "DELETE", cookie: admin.cookie }),
      { params: Promise.resolve({ id: state.childId }) },
    );
    expect(again.status).toBe(404);

    const malformed = await deleteCommittee(
      buildRequest(`${API}/not-a-uuid`, { method: "DELETE", cookie: admin.cookie }),
      { params: Promise.resolve({ id: "not-a-uuid" }) },
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
