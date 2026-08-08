/**
 * Awards API — nominations: create validation, unknown-FK validation errors,
 * the review lifecycle (pending → under_review → approved/rejected), list
 * filters, and delete (backlog D4). Route handlers are called directly;
 * shared fixtures and RUN_ID isolation live in ./helpers.
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
  type ListMeta,
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
});

afterAll(async () => {
  await sweepFixtures(RUN_ID, programIds, userIds);
});

describe("award nominations", () => {
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
