/**
 * D2 — Committees API integration tests: PATCH update behavior.
 *
 * Covers staff field updates with charter approvalDate preservation, the
 * member 403 on PATCH, and the 422 for an empty PATCH body.
 *
 * Runs against the shared test database (DATABASE_URL from .env). Every row
 * this file creates is RUN_ID-isolated and removed in afterAll, so the file
 * is self-cleaning and safe to run alongside other test files.
 */

import { afterAll, beforeAll, describe, expect, test } from "bun:test";

import { PATCH as updateCommittee } from "@/app/api/v1/committees/[id]/route";

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
  // Reproduce the committee the PATCH tests update; its server-managed
  // approvalDate is the value the preservation assertion compares against.
  const seeded = await seedCommittee(registry, admin);
  state.committeeId = seeded.id;
  state.approvalDate = seeded.charter.approvalDate;
});

afterAll(async () => {
  await cleanupCommitteesRun(registry);
});

describe("committees update", () => {
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
