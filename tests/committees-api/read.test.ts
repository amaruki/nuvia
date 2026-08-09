/**
 * D2 — Committees API integration tests: reading a single committee.
 *
 * Covers the GET envelope for an existing committee, 404s for unknown and
 * malformed ids, read RBAC (staff can, member cannot), and the
 * leadership/member split sourced from committee_members roles.
 *
 * Runs against the shared test database (DATABASE_URL from .env). Every row
 * this file creates is RUN_ID-isolated and removed in afterAll, so the file
 * is self-cleaning and safe to run alongside other test files.
 */

import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { db } from "@/db/client";
import { committeeMember } from "@/db/schema";

import { GET as getCommittee } from "@/app/api/v1/committees/[id]/route";

import {
  API,
  buildRequest,
  cleanupCommitteesRun,
  createRegistry,
  parseEnvelope,
  seedCommittee,
  signUpActors,
  type Actor,
  type CommitteeWire,
} from "./fixtures";

const registry = createRegistry();

/** Values shared between ordered tests within this file. */
const state: Record<string, string> = {};

let admin: Actor = { userId: "", cookie: "" };
let staff: Actor = { userId: "", cookie: "" };
let member: Actor = { userId: "", cookie: "" };

beforeAll(async () => {
  ({ admin, staff, member } = await signUpActors(registry));
  // Reproduce the committee the read tests assert against.
  const seeded = await seedCommittee(registry, admin);
  state.committeeId = seeded.id;
  state.committeeName = seeded.name;
});

afterAll(async () => {
  await cleanupCommitteesRun(registry);
});

describe("committees read", () => {
  test("get returns the committee; unknown and malformed ids 404", async () => {
    const res = await getCommittee(
      buildRequest(`${API}/${state.committeeId}`, { cookie: admin.cookie }),
      { params: Promise.resolve({ id: state.committeeId }) },
    );
    expect(res.status).toBe(200);
    const { data } = await parseEnvelope<CommitteeWire>(res);
    expect(data.id).toBe(state.committeeId);
    expect(data.name).toBe(state.committeeName);

    const missing = await getCommittee(
      buildRequest(`${API}/${crypto.randomUUID()}`, { cookie: admin.cookie }),
      { params: Promise.resolve({ id: crypto.randomUUID() }) },
    );
    expect(missing.status).toBe(404);

    const malformed = await getCommittee(
      buildRequest(`${API}/not-a-uuid`, { cookie: admin.cookie }),
      { params: Promise.resolve({ id: "not-a-uuid" }) },
    );
    expect(malformed.status).toBe(404);
  });

  test("staff can read, member cannot", async () => {
    expect(
      (
        await getCommittee(buildRequest(`${API}/${state.committeeId}`, { cookie: staff.cookie }), {
          params: Promise.resolve({ id: state.committeeId }),
        })
      ).status,
    ).toBe(200);
    expect(
      (
        await getCommittee(buildRequest(`${API}/${state.committeeId}`, { cookie: member.cookie }), {
          params: Promise.resolve({ id: state.committeeId }),
        })
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
        email: `chair-${registry.runId}@example.test`,
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
        email: `member-${registry.runId}@example.test`,
        role: "member",
        expertise: ["testing", "documentation"],
      })
      .returning();

    const res = await getCommittee(
      buildRequest(`${API}/${state.committeeId}`, { cookie: admin.cookie }),
      { params: Promise.resolve({ id: state.committeeId }) },
    );
    const { data } = await parseEnvelope<CommitteeWire>(res);
    expect(data.leadership.map((l) => l.id)).toEqual([chairRow!.id]);
    expect(data.leadership[0].role).toBe("chair");
    expect(data.leadership[0].responsibilities).toEqual([
      "Set the agenda",
      "Represent the committee",
    ]);
    expect(data.members.map((m) => m.id)).toEqual([memberRow!.id]);
    expect(data.members[0].expertise).toEqual(["testing", "documentation"]);
    expect(data.metrics.memberCount).toBe(2);
    expect(data.metrics.activeMembersCount).toBe(2);
  });
});
