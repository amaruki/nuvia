/**
 * D2 — Committees API integration tests: CRUD and RBAC.
 *
 * Covers the RBAC matrix (admin all, staff read/update/manage, member none),
 * create validation, unique-name conflicts, server-managed charter dates,
 * the leadership/member split from committee_members, and PATCH behavior
 * including charter approvalDate preservation.
 *
 * Runs against the shared test database (DATABASE_URL from .env). Every row
 * this file creates is RUN_ID-isolated and removed in afterAll, so the file
 * is self-cleaning and safe to run alongside other test files.
 */

import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { db } from "@/db/client";
import { committeeMember } from "@/db/schema";

import { GET as listCommittees, POST as createCommittee } from "@/app/api/v1/committees/route";
import { GET as getCommittee, PATCH as updateCommittee } from "@/app/api/v1/committees/[id]/route";

import {
  API,
  buildRequest,
  cleanupCommitteesRun,
  committeePayload,
  createRegistry,
  parseEnvelope,
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
});

afterAll(async () => {
  await cleanupCommitteesRun(registry);
});

describe("committees CRUD", () => {
  test("listing and creating require authentication and committees permissions", async () => {
    expect((await listCommittees(buildRequest(API))).status).toBe(401);
    // the "member" role holds no committees:* permissions
    expect((await listCommittees(buildRequest(API, { cookie: member.cookie }))).status).toBe(403);

    expect(
      (
        await createCommittee(
          buildRequest(API, { method: "POST", body: committeePayload(registry) }),
        )
      ).status,
    ).toBe(401);
    expect(
      (
        await createCommittee(
          buildRequest(API, {
            method: "POST",
            cookie: member.cookie,
            body: committeePayload(registry),
          }),
        )
      ).status,
    ).toBe(403);
    // staff holds committees:read/update/manage but not committees:create
    expect(
      (
        await createCommittee(
          buildRequest(API, {
            method: "POST",
            cookie: staff.cookie,
            body: committeePayload(registry),
          }),
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
        body: committeePayload(registry, { status: "dissolved" }),
      }),
    );
    expect(badStatus.status).toBe(422);

    const missingCharter = await createCommittee(
      buildRequest(API, {
        method: "POST",
        cookie: admin.cookie,
        body: committeePayload(registry, { charter: undefined }),
      }),
    );
    expect(missingCharter.status).toBe(422);

    const badEmail = await createCommittee(
      buildRequest(API, {
        method: "POST",
        cookie: admin.cookie,
        body: committeePayload(registry, { contactInfo: { email: "not-an-email" } }),
      }),
    );
    expect(badEmail.status).toBe(422);
  });

  test("admin creates a committee with server-managed charter dates", async () => {
    const payload = committeePayload(registry);
    const res = await createCommittee(
      buildRequest(API, { method: "POST", cookie: admin.cookie, body: payload }),
    );
    expect(res.status).toBe(201);

    const { data } = await parseEnvelope<CommitteeWire>(res);
    state.committeeId = data.id;
    state.committeeName = payload.name;
    state.approvalDate = data.charter.approvalDate;
    registry.committeeIds.push(data.id);

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
        body: committeePayload(registry, { name: state.committeeName }),
      }),
    );
    expect(res.status).toBe(409);
    const problemBody = (await res.json()) as { detail?: string };
    expect(problemBody.detail).toContain(state.committeeName);
  });

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

  test("staff patches fields; charter approvalDate is preserved", async () => {
    const res = await updateCommittee(
      buildRequest(`${API}/${state.committeeId}`, {
        method: "PATCH",
        cookie: staff.cookie,
        body: {
          displayName: `D2 Renamed Committee ${registry.runId}`,
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
      { params: Promise.resolve({ id: state.committeeId }) },
    );
    expect(res.status).toBe(200);

    const { data } = await parseEnvelope<CommitteeWire>(res);
    expect(data.displayName).toBe(`D2 Renamed Committee ${registry.runId}`);
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
          { params: Promise.resolve({ id: state.committeeId }) },
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
      { params: Promise.resolve({ id: state.committeeId }) },
    );
    expect(res.status).toBe(422);
  });
});
