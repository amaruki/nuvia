/**
 * D2 — Committees API integration tests: creation and its permission guards.
 *
 * Covers the list/create authentication and permission matrix (admin create,
 * staff and member none), create payload validation, the created envelope
 * with server-managed charter dates, and unique-name 409 conflicts.
 *
 * Runs against the shared test database (DATABASE_URL from .env). Every row
 * this file creates is RUN_ID-isolated and removed in afterAll, so the file
 * is self-cleaning and safe to run alongside other test files.
 */

import { afterAll, beforeAll, describe, expect, test } from "bun:test";

import { GET as listCommittees, POST as createCommittee } from "@/app/api/v1/committees/route";

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

describe("committees creation", () => {
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
    state.committeeName = payload.name;
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
});
