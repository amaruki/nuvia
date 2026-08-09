/**
 * Awards API — nomination listing: program/status/search filters over the
 * RUN_ID baseline delta (backlog D4). Route handlers are called directly;
 * shared fixtures and RUN_ID isolation live in ./helpers.
 */

import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { POST as createProgram } from "@/app/api/v1/awards/programs/route";
import {
  GET as listNominations,
  POST as createNomination,
} from "@/app/api/v1/awards/nominations/route";
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
  type ListMeta,
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
  // alpha hosts the nominations; beta exists so programId filters can miss.
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
  for (const suffix of ["one", "two", "three"] as const) {
    await seedNomination(suffix);
  }
});

afterAll(async () => {
  await sweepFixtures(RUN_ID, programIds, userIds);
});

/** Local factory: POSTs a pending nomination on alpha and records its id. */
async function seedNomination(suffix: string): Promise<void> {
  const res = await createNomination(
    buildRequest(NOMINATIONS_API, {
      method: "POST",
      cookie: admin.cookie,
      body: nominationPayload(RUN_ID, state.alphaId, suffix),
    }),
  );
  if (res.status !== 201) throw new Error(`nomination seed failed: ${res.status}`);
  const envelope = await parseJson<{ data: WireNomination }>(res);
  state[`nomination${suffix}Id`] = envelope.data.id;
}

describe("award nomination listing", () => {
  test("nomination list filters by program, status, and search", async () => {
    // Baseline delta on nominee names containing RUN_ID.
    const all = await parseJson<{ data: WireNomination[]; meta: ListMeta }>(
      await listNominations(
        buildRequest(`${NOMINATIONS_API}?search=${RUN_ID}&limit=100`, { cookie: admin.cookie }),
      ),
    );
    expect(all.data.length).toBe(3);
    expect(all.meta.total).toBe(3);

    const byProgram = await parseJson<{ data: WireNomination[] }>(
      await listNominations(
        buildRequest(`${NOMINATIONS_API}?programId=${state.alphaId}&search=${RUN_ID}`, {
          cookie: admin.cookie,
        }),
      ),
    );
    expect(byProgram.data.length).toBe(3);

    const missProgram = await parseJson<{ data: WireNomination[] }>(
      await listNominations(
        buildRequest(`${NOMINATIONS_API}?programId=${state.betaId}&search=${RUN_ID}`, {
          cookie: admin.cookie,
        }),
      ),
    );
    expect(missProgram.data.length).toBe(0);

    const byNominee = await parseJson<{ data: WireNomination[] }>(
      await listNominations(
        buildRequest(`${NOMINATIONS_API}?search=d4-nominee-two-${RUN_ID}`, {
          cookie: admin.cookie,
        }),
      ),
    );
    expect(byNominee.data.length).toBe(1);
    expect(byNominee.data[0].nomineeName).toBe(`d4-nominee-two-${RUN_ID}`);
  });
});
