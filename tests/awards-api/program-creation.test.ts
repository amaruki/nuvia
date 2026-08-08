/**
 * Awards API — program creation: payload validation, the 201 envelope, and
 * unique-name conflicts (backlog D4). Route handlers are called directly;
 * shared fixtures and RUN_ID isolation live in ./helpers.
 */

import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { POST as createProgram } from "@/app/api/v1/awards/programs/route";
import {
  buildRequest,
  newRunId,
  parseJson,
  PROGRAMS_API,
  programPayload,
  signUpWithRole,
  sweepFixtures,
  type TestUser,
  type WireProgram,
} from "./helpers";

const RUN_ID = newRunId();

const userIds: string[] = [];
const programIds: string[] = [];

let admin: TestUser = { userId: "", email: "", cookie: "" };

beforeAll(async () => {
  admin = await signUpWithRole(RUN_ID, "admin", "admin", userIds);
});

afterAll(async () => {
  await sweepFixtures(RUN_ID, programIds, userIds);
});

describe("award program creation", () => {
  test("create validates the payload", async () => {
    const empty = await createProgram(
      buildRequest(PROGRAMS_API, { method: "POST", cookie: admin.cookie, body: {} }),
    );
    expect(empty.status).toBe(422);

    const badStatus = await createProgram(
      buildRequest(PROGRAMS_API, {
        method: "POST",
        cookie: admin.cookie,
        body: programPayload(RUN_ID, "bad", { status: "dormant" }),
      }),
    );
    expect(badStatus.status).toBe(422);

    const badCategory = await createProgram(
      buildRequest(PROGRAMS_API, {
        method: "POST",
        cookie: admin.cookie,
        body: programPayload(RUN_ID, "bad", { category: "misc" }),
      }),
    );
    expect(badCategory.status).toBe(422);

    const shortName = await createProgram(
      buildRequest(PROGRAMS_API, {
        method: "POST",
        cookie: admin.cookie,
        body: programPayload(RUN_ID, "short", { name: "ab" }),
      }),
    );
    expect(shortName.status).toBe(422);

    // openDate after closeDate is an invalid nomination window
    const badWindow = await createProgram(
      buildRequest(PROGRAMS_API, {
        method: "POST",
        cookie: admin.cookie,
        body: programPayload(RUN_ID, "window", {
          openDate: "2026-07-01T00:00:00.000Z",
          closeDate: "2026-01-01T00:00:00.000Z",
        }),
      }),
    );
    expect(badWindow.status).toBe(422);
  });

  test("admin creates a program and the envelope carries the full UI shape", async () => {
    const res = await createProgram(
      buildRequest(PROGRAMS_API, {
        method: "POST",
        cookie: admin.cookie,
        body: programPayload(RUN_ID, "alpha"),
      }),
    );
    expect(res.status).toBe(201);

    const envelope = await parseJson<{ data: WireProgram }>(res);
    const created = envelope.data;
    programIds.push(created.id);

    expect(created.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(created.name).toBe(`d4-program-alpha-${RUN_ID}`);
    expect(created.status).toBe("open");
    expect(created.category).toBe("achievement");
    expect(created.criteria).toEqual([
      "Open to all members",
      "Work must be published in the last 12 months",
    ]);
    expect(created.openDate).toBe("2026-01-01T00:00:00.000Z");
    expect(created.closeDate).toBe("2026-06-30T23:59:59.000Z");
    expect(created.awardDate).toBe("2026-09-15T00:00:00.000Z");
    expect(created.nominationCount).toBe(0);
    expect(created.createdBy).toBe(admin.email);
  });

  test("duplicate name is rejected with a conflict", async () => {
    const res = await createProgram(
      buildRequest(PROGRAMS_API, {
        method: "POST",
        cookie: admin.cookie,
        body: programPayload(RUN_ID, "alpha"),
      }),
    );
    expect(res.status).toBe(409);
    const body = await parseJson<{ data?: unknown }>(res);
    // RFC 9457 problem document, not the success envelope
    expect(body.data).toBeUndefined();
  });
});
