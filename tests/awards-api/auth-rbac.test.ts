/**
 * Awards API — authentication and per-action RBAC (backlog D4). Route
 * handlers are called directly (no HTTP server); shared fixtures and RUN_ID
 * isolation live in ./helpers.
 */

import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { GET as listPrograms, POST as createProgram } from "@/app/api/v1/awards/programs/route";
import {
  DELETE as deleteProgram,
  GET as getProgram,
  PATCH as updateProgram,
} from "@/app/api/v1/awards/programs/[id]/route";
import {
  GET as listNominations,
  POST as createNomination,
} from "@/app/api/v1/awards/nominations/route";
import {
  DELETE as deleteNomination,
  GET as getNomination,
  PATCH as updateNomination,
} from "@/app/api/v1/awards/nominations/[id]/route";
import {
  buildRequest,
  ctx,
  newRunId,
  NOMINATIONS_API,
  nominationPayload,
  PROGRAMS_API,
  programPayload,
  signUpWithRole,
  sweepFixtures,
  type TestUser,
} from "./helpers";

const RUN_ID = newRunId();

const userIds: string[] = [];

let staff: TestUser = { userId: "", email: "", cookie: "" };
let member: TestUser = { userId: "", email: "", cookie: "" };

beforeAll(async () => {
  [staff, member] = await Promise.all([
    signUpWithRole(RUN_ID, "staff", "staff", userIds),
    signUpWithRole(RUN_ID, "member", "member", userIds),
  ]);
});

afterAll(async () => {
  await sweepFixtures(RUN_ID, [], userIds);
});

describe("awards authentication and RBAC", () => {
  test("listing and creating programs require authentication and awards permissions", async () => {
    expect((await listPrograms(buildRequest(PROGRAMS_API))).status).toBe(401);
    expect((await listPrograms(buildRequest(PROGRAMS_API, { cookie: member.cookie }))).status).toBe(
      403,
    );

    expect(
      (
        await createProgram(
          buildRequest(PROGRAMS_API, { method: "POST", body: programPayload(RUN_ID, "anon") }),
        )
      ).status,
    ).toBe(401);
    expect(
      (
        await createProgram(
          buildRequest(PROGRAMS_API, {
            method: "POST",
            cookie: member.cookie,
            body: programPayload(RUN_ID, "m"),
          }),
        )
      ).status,
    ).toBe(403);
    // staff holds awards:read/update/manage but not awards:create
    expect(
      (
        await createProgram(
          buildRequest(PROGRAMS_API, {
            method: "POST",
            cookie: staff.cookie,
            body: programPayload(RUN_ID, "s"),
          }),
        )
      ).status,
    ).toBe(403);
  });

  test("listing and creating nominations require authentication and awards permissions", async () => {
    expect((await listNominations(buildRequest(NOMINATIONS_API))).status).toBe(401);
    expect(
      (await listNominations(buildRequest(NOMINATIONS_API, { cookie: member.cookie }))).status,
    ).toBe(403);

    const missing = "00000000-0000-4000-8000-000000000000";
    expect(
      (
        await createNomination(
          buildRequest(NOMINATIONS_API, {
            method: "POST",
            body: nominationPayload(RUN_ID, missing, "anon"),
          }),
        )
      ).status,
    ).toBe(401);
    expect(
      (
        await createNomination(
          buildRequest(NOMINATIONS_API, {
            method: "POST",
            cookie: member.cookie,
            body: nominationPayload(RUN_ID, missing, "m"),
          }),
        )
      ).status,
    ).toBe(403);
  });

  test("item reads require awards:read", async () => {
    const missing = "00000000-0000-4000-8000-000000000000";
    expect(
      (await getProgram(buildRequest(`${PROGRAMS_API}/${missing}`), ctx({ id: missing }))).status,
    ).toBe(401);
    expect(
      (
        await getProgram(
          buildRequest(`${PROGRAMS_API}/${missing}`, { cookie: member.cookie }),
          ctx({ id: missing }),
        )
      ).status,
    ).toBe(403);
    expect(
      (
        await getNomination(
          buildRequest(`${NOMINATIONS_API}/${missing}`, { cookie: member.cookie }),
          ctx({ id: missing }),
        )
      ).status,
    ).toBe(403);
  });

  test("staff can read and update but not delete", async () => {
    const missing = "00000000-0000-4000-8000-000000000000";
    expect(
      (
        await deleteProgram(
          buildRequest(`${PROGRAMS_API}/${missing}`, { cookie: staff.cookie }),
          ctx({ id: missing }),
        )
      ).status,
    ).toBe(403);
    expect(
      (
        await deleteNomination(
          buildRequest(`${NOMINATIONS_API}/${missing}`, { cookie: staff.cookie }),
          ctx({ id: missing }),
        )
      ).status,
    ).toBe(403);
    // PATCH reaches the service layer (404, not 403) — staff holds awards:update.
    expect(
      (
        await updateProgram(
          buildRequest(`${PROGRAMS_API}/${missing}`, {
            method: "PATCH",
            cookie: staff.cookie,
            body: { status: "closed" },
          }),
          ctx({ id: missing }),
        )
      ).status,
    ).toBe(404);
    expect(
      (
        await updateNomination(
          buildRequest(`${NOMINATIONS_API}/${missing}`, {
            method: "PATCH",
            cookie: member.cookie,
            body: { status: "approved" },
          }),
          ctx({ id: missing }),
        )
      ).status,
    ).toBe(403);
  });
});
