/**
 * Awards API — nominations: the review lifecycle (pending → under_review →
 * approved/rejected), program nominationCount, read/404 handling, and
 * delete (backlog D4). Route handlers are called directly; shared fixtures
 * and RUN_ID isolation live in ./helpers.
 */

import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { POST as createProgram } from "@/app/api/v1/awards/programs/route";
import { GET as getProgram } from "@/app/api/v1/awards/programs/[id]/route";
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

describe("award nomination review and read", () => {
  test("PATCH walks the review lifecycle and validates payloads", async () => {
    const emptyBody = await updateNomination(
      buildRequest(NOMINATIONS_API + "/" + state.nominationoneId, {
        method: "PATCH",
        cookie: admin.cookie,
        body: {},
      }),
      ctx({ id: state.nominationoneId }),
    );
    expect(emptyBody.status).toBe(422);

    const badStatus = await updateNomination(
      buildRequest(NOMINATIONS_API + "/" + state.nominationoneId, {
        method: "PATCH",
        cookie: admin.cookie,
        body: { status: "celebrated" },
      }),
      ctx({ id: state.nominationoneId }),
    );
    expect(badStatus.status).toBe(422);

    // pending → under_review → approved
    const toReview = await updateNomination(
      buildRequest(NOMINATIONS_API + "/" + state.nominationoneId, {
        method: "PATCH",
        cookie: admin.cookie,
        body: { status: "under_review" },
      }),
      ctx({ id: state.nominationoneId }),
    );
    expect(toReview.status).toBe(200);
    expect((await parseJson<{ data: WireNomination }>(toReview)).data.status).toBe("under_review");

    const approve = await updateNomination(
      buildRequest(NOMINATIONS_API + "/" + state.nominationoneId, {
        method: "PATCH",
        cookie: admin.cookie,
        body: { status: "approved" },
      }),
      ctx({ id: state.nominationoneId }),
    );
    expect(approve.status).toBe(200);
    const approvedBody = await parseJson<{ data: WireNomination }>(approve);
    expect(approvedBody.data.status).toBe("approved");
    expect(approvedBody.data.updatedBy).toBe(admin.email);

    // Reject nomination two; nomination three stays pending.
    const reject = await updateNomination(
      buildRequest(NOMINATIONS_API + "/" + state.nominationtwoId, {
        method: "PATCH",
        cookie: admin.cookie,
        body: { status: "rejected", statement: `Not eligible (${RUN_ID})` },
      }),
      ctx({ id: state.nominationtwoId }),
    );
    expect(reject.status).toBe(200);
    expect((await parseJson<{ data: WireNomination }>(reject)).data.statement).toBe(
      `Not eligible (${RUN_ID})`,
    );

    // Status filter sees the transitions.
    const approved = await parseJson<{ data: WireNomination[] }>(
      await listNominations(
        buildRequest(`${NOMINATIONS_API}?programId=${state.alphaId}&status=approved`, {
          cookie: admin.cookie,
        }),
      ),
    );
    expect(approved.data.length).toBe(1);
    expect(approved.data[0].status).toBe("approved");

    const pendingAndRejected = await parseJson<{ data: WireNomination[] }>(
      await listNominations(
        buildRequest(`${NOMINATIONS_API}?programId=${state.alphaId}&status=pending,rejected`, {
          cookie: admin.cookie,
        }),
      ),
    );
    expect(pendingAndRejected.data.length).toBe(2);
  });

  test("program nominationCount reflects its nominations", async () => {
    const res = await getProgram(
      buildRequest(`${PROGRAMS_API}/${state.alphaId}`, { cookie: admin.cookie }),
      ctx({ id: state.alphaId }),
    );
    expect(res.status).toBe(200);
    expect((await parseJson<{ data: WireProgram }>(res)).data.nominationCount).toBe(3);
  });

  test("get by id hydrates programName; unknown ids 404", async () => {
    const res = await getNomination(
      buildRequest(`${NOMINATIONS_API}/${state.nominationoneId}`, { cookie: admin.cookie }),
      ctx({ id: state.nominationoneId }),
    );
    expect(res.status).toBe(200);
    const body = await parseJson<{ data: WireNomination }>(res);
    expect(body.data.programName).toBe(`d4-program-alpha-${RUN_ID}`);
    expect(body.data.statement).toContain(RUN_ID);

    const missing = "00000000-0000-4000-8000-000000000000";
    expect(
      (await getNomination(buildRequest(`${NOMINATIONS_API}/${missing}`), ctx({ id: missing })))
        .status,
    ).toBe(401);
    expect(
      (
        await getNomination(
          buildRequest(`${NOMINATIONS_API}/${missing}`, { cookie: admin.cookie }),
          ctx({ id: missing }),
        )
      ).status,
    ).toBe(404);
  });
});

describe("award nomination deletion", () => {
  test("delete nomination removes only that row", async () => {
    const res = await deleteNomination(
      buildRequest(`${NOMINATIONS_API}/${state.nominationthreeId}`, { cookie: admin.cookie }),
      ctx({ id: state.nominationthreeId }),
    );
    expect(res.status).toBe(200);
    expect((await parseJson<{ data: { id: string; deleted: boolean } }>(res)).data).toEqual({
      id: state.nominationthreeId,
      deleted: true,
    });

    expect(
      (
        await deleteNomination(
          buildRequest(`${NOMINATIONS_API}/${state.nominationthreeId}`, { cookie: admin.cookie }),
          ctx({ id: state.nominationthreeId }),
        )
      ).status,
    ).toBe(404);

    const alpha = await parseJson<{ data: WireProgram }>(
      await getProgram(
        buildRequest(`${PROGRAMS_API}/${state.alphaId}`, { cookie: admin.cookie }),
        ctx({ id: state.alphaId }),
      ),
    );
    expect(alpha.data.nominationCount).toBe(2);
  });
});
