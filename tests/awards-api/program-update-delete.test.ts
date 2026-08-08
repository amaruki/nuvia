/**
 * Awards API — program read/update and deletion: 404 handling, PATCH
 * validation and field updates, name-conflict and inverted-window guards,
 * and program DELETE cascading its nominations (backlog D4). Route handlers
 * are called directly; shared fixtures and RUN_ID isolation live in
 * ./helpers.
 */

import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { POST as createProgram } from "@/app/api/v1/awards/programs/route";
import {
  DELETE as deleteProgram,
  GET as getProgram,
  PATCH as updateProgram,
} from "@/app/api/v1/awards/programs/[id]/route";
import { POST as createNomination } from "@/app/api/v1/awards/nominations/route";
import {
  getAwardNomination as getAwardNominationDirect,
  getAwardProgram as getAwardProgramDirect,
} from "@/lib/services/award";
import {
  buildRequest,
  ctx,
  newRunId,
  NOMINATIONS_API,
  nominationPayload,
  parseJson,
  PROGRAMS_API,
  programPayload,
  signUpWithRole,
  sweepFixtures,
  type TestUser,
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
  // alpha and beta mirror the programs the monolith suite read and patched.
  for (const [suffix, overrides] of [
    ["alpha", {}],
    ["beta", { status: "draft", category: "scholarship" }],
  ] as const) {
    const res = await createProgram(
      buildRequest(PROGRAMS_API, {
        method: "POST",
        cookie: admin.cookie,
        body: programPayload(RUN_ID, suffix, overrides),
      }),
    );
    const envelope = await parseJson<{ data: WireProgram }>(res);
    programIds.push(envelope.data.id);
    state[`${suffix}Id`] = envelope.data.id;
  }
});

afterAll(async () => {
  await sweepFixtures(RUN_ID, programIds, userIds);
});

describe("award program read and update", () => {
  test("unknown program is a 404", async () => {
    const missing = "00000000-0000-4000-8000-000000000000";
    expect(
      (
        await getProgram(
          buildRequest(`${PROGRAMS_API}/${missing}`, { cookie: admin.cookie }),
          ctx({ id: missing }),
        )
      ).status,
    ).toBe(404);
  });

  test("PATCH validates the payload", async () => {
    const empty = await updateProgram(
      buildRequest(`${PROGRAMS_API}/${state.betaId}`, {
        method: "PATCH",
        cookie: admin.cookie,
        body: {},
      }),
      ctx({ id: state.betaId }),
    );
    expect(empty.status).toBe(422);

    const badCategory = await updateProgram(
      buildRequest(`${PROGRAMS_API}/${state.betaId}`, {
        method: "PATCH",
        cookie: admin.cookie,
        body: { category: "misc" },
      }),
      ctx({ id: state.betaId }),
    );
    expect(badCategory.status).toBe(422);
  });

  test("PATCH updates fields and records updatedBy", async () => {
    const res = await updateProgram(
      buildRequest(`${PROGRAMS_API}/${state.betaId}`, {
        method: "PATCH",
        cookie: admin.cookie,
        body: {
          status: "open",
          category: "leadership",
          description: `Updated description (${RUN_ID})`,
          criteria: ["New criteria only"],
          awardDate: null,
        },
      }),
      ctx({ id: state.betaId }),
    );
    expect(res.status).toBe(200);

    const envelope = await parseJson<{ data: WireProgram }>(res);
    expect(envelope.data.status).toBe("open");
    expect(envelope.data.category).toBe("leadership");
    expect(envelope.data.description).toBe(`Updated description (${RUN_ID})`);
    expect(envelope.data.criteria).toEqual(["New criteria only"]);
    expect(envelope.data.awardDate).toBeUndefined();
    expect(envelope.data.updatedBy).toBe(admin.email);
    expect(envelope.data.name).toBe(`d4-program-beta-${RUN_ID}`);
  });

  test("PATCH into an existing name is a conflict", async () => {
    const res = await updateProgram(
      buildRequest(`${PROGRAMS_API}/${state.betaId}`, {
        method: "PATCH",
        cookie: admin.cookie,
        body: { name: `d4-program-alpha-${RUN_ID}` },
      }),
      ctx({ id: state.betaId }),
    );
    expect(res.status).toBe(409);
  });

  test("PATCH rejecting an inverted nomination window is a validation error", async () => {
    const res = await updateProgram(
      buildRequest(`${PROGRAMS_API}/${state.alphaId}`, {
        method: "PATCH",
        cookie: admin.cookie,
        body: { closeDate: "2025-12-31T23:59:59.000Z" },
      }),
      ctx({ id: state.alphaId }),
    );
    // alpha keeps openDate 2026-01-01; the patched closeDate would invert the window
    expect(res.status).toBe(422);
  });
});

describe("award program deletion", () => {
  test("deleting a program cascades its nominations", async () => {
    // Disposable program with one nomination.
    const created = await parseJson<{ data: WireProgram }>(
      await createProgram(
        buildRequest(PROGRAMS_API, {
          method: "POST",
          cookie: admin.cookie,
          body: programPayload(RUN_ID, "disposable", { status: "archived" }),
        }),
      ),
    );
    const disposableId = created.data.id;
    programIds.push(disposableId);

    const nomination = await parseJson<{ data: WireNomination }>(
      await createNomination(
        buildRequest(NOMINATIONS_API, {
          method: "POST",
          cookie: admin.cookie,
          body: nominationPayload(RUN_ID, disposableId, "cascade"),
        }),
      ),
    );
    const nominationId = nomination.data.id;

    const res = await deleteProgram(
      buildRequest(`${PROGRAMS_API}/${disposableId}`, { cookie: admin.cookie }),
      ctx({ id: disposableId }),
    );
    expect(res.status).toBe(200);
    expect((await parseJson<{ data: { id: string; deleted: boolean } }>(res)).data).toEqual({
      id: disposableId,
      deleted: true,
    });

    // The nomination is gone with its parent.
    expect(await getAwardNominationDirect(nominationId)).toBeNull();
    expect(await getAwardProgramDirect(disposableId)).toBeNull();

    expect(
      (
        await deleteProgram(
          buildRequest(`${PROGRAMS_API}/${disposableId}`, { cookie: admin.cookie }),
          ctx({ id: disposableId }),
        )
      ).status,
    ).toBe(404);
  });
});
