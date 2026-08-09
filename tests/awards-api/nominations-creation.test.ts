/**
 * Awards API — nomination creation: payload validation, unknown-FK
 * validation errors, and the created envelope's UI shape (backlog D4).
 * Route handlers are called directly; shared fixtures and RUN_ID
 * isolation live in ./helpers.
 */

import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { POST as createProgram } from "@/app/api/v1/awards/programs/route";
import { POST as createNomination } from "@/app/api/v1/awards/nominations/route";
import {
  buildRequest,
  newRunId,
  NOMINATIONS_API,
  nominationPayload,
  parseJson,
  PROGRAMS_API,
  programPayload,
  signUpWithRole,
  sweepFixtures,
  type TestUser,
  type ValidationIssue,
  type WireNomination,
  type WireProgram,
} from "./helpers";

const RUN_ID = newRunId();

const state: Record<string, string> = {};
const userIds: string[] = [];
const programIds: string[] = [];

let admin: TestUser = { userId: "", email: "", cookie: "" };

beforeAll(async () => {
  admin = await signUpWithRole(RUN_ID, "admin", "admin", userIds);
  // alpha hosts the nominations under test.
  const res = await createProgram(
    buildRequest(PROGRAMS_API, {
      method: "POST",
      cookie: admin.cookie,
      body: programPayload(RUN_ID, "alpha"),
    }),
  );
  const envelope = await parseJson<{ data: WireProgram }>(res);
  programIds.push(envelope.data.id);
  state.alphaId = envelope.data.id;
});

afterAll(async () => {
  await sweepFixtures(RUN_ID, programIds, userIds);
});

describe("award nomination creation", () => {
  test("create validates the payload", async () => {
    const empty = await createNomination(
      buildRequest(NOMINATIONS_API, { method: "POST", cookie: admin.cookie, body: {} }),
    );
    expect(empty.status).toBe(422);

    const badEmail = await createNomination(
      buildRequest(NOMINATIONS_API, {
        method: "POST",
        cookie: admin.cookie,
        body: nominationPayload(RUN_ID, state.alphaId, "bad", { nomineeEmail: "not-an-email" }),
      }),
    );
    expect(badEmail.status).toBe(422);

    const missingName = await createNomination(
      buildRequest(NOMINATIONS_API, {
        method: "POST",
        cookie: admin.cookie,
        body: nominationPayload(RUN_ID, state.alphaId, "bad", { nomineeName: "" }),
      }),
    );
    expect(missingName.status).toBe(422);
  });

  test("unknown program and unknown user are validation errors", async () => {
    const missing = "00000000-0000-4000-8000-000000000000";

    const unknownProgram = await createNomination(
      buildRequest(NOMINATIONS_API, {
        method: "POST",
        cookie: admin.cookie,
        body: nominationPayload(RUN_ID, missing, "orphan"),
      }),
    );
    expect(unknownProgram.status).toBe(422);
    const programBody = await parseJson<{ errors?: ValidationIssue[] }>(unknownProgram);
    expect(programBody.errors?.some((issue) => issue.field === "programId")).toBe(true);

    const unknownUser = await createNomination(
      buildRequest(NOMINATIONS_API, {
        method: "POST",
        cookie: admin.cookie,
        body: nominationPayload(RUN_ID, state.alphaId, "ghost", { userId: missing }),
      }),
    );
    expect(unknownUser.status).toBe(422);
    const userBody = await parseJson<{ errors?: ValidationIssue[] }>(unknownUser);
    expect(userBody.errors?.some((issue) => issue.field === "userId")).toBe(true);
  });

  test("admin creates nominations and the envelope carries the UI shape", async () => {
    for (const suffix of ["one", "two", "three"] as const) {
      const res = await createNomination(
        buildRequest(NOMINATIONS_API, {
          method: "POST",
          cookie: admin.cookie,
          body: nominationPayload(RUN_ID, state.alphaId, suffix),
        }),
      );
      expect(res.status).toBe(201);

      const envelope = await parseJson<{ data: WireNomination }>(res);
      const created = envelope.data;
      state[`nomination${suffix}Id`] = created.id;

      expect(created.id).toMatch(/^[0-9a-f-]{36}$/);
      expect(created.programId).toBe(state.alphaId);
      expect(created.programName).toBe(`d4-program-alpha-${RUN_ID}`);
      expect(created.status).toBe("pending");
      expect(created.nomineeName).toBe(`d4-nominee-${suffix}-${RUN_ID}`);
      expect(created.statement).toContain(RUN_ID);
      expect(created.createdBy).toBe(admin.email);
    }
  });
});
