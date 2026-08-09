/**
 * Jobs API — application creation: apply guards (auth, draft/unknown
 * postings, payload validation, expired deadline), the created envelope,
 * duplicate rejection, and the posting's applicationCount counter. Route
 * handlers are called directly; shared fixtures and RUN_ID isolation live
 * in ./helpers.
 */

import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { POST as createPosting } from "@/app/api/v1/jobs/route";
import { GET as getPosting } from "@/app/api/v1/jobs/[id]/route";
import { POST as applyToJob } from "@/app/api/v1/jobs/[id]/applications/route";
import { createJobsApiFixtures } from "./helpers";

const {
  RUN_ID,
  API,
  postingIds,
  buildRequest,
  ctx,
  parseEnvelope,
  postingPayload,
  setup,
  teardown,
} = createJobsApiFixtures();

/** Values shared between ordered tests within this file. */
const state: Record<string, string> = {};

let admin = { userId: "", cookie: "" };
let member = { userId: "", cookie: "" };
let applicant = { userId: "", cookie: "" };
let applicant2 = { userId: "", cookie: "" };

beforeAll(async () => {
  ({ admin, member, applicant, applicant2 } = await setup());
});

afterAll(async () => {
  await teardown();
});

describe("job application creation", () => {
  test("setup: one published and one draft posting", async () => {
    const published = await createPosting(
      buildRequest(API, {
        method: "POST",
        cookie: admin.cookie,
        body: postingPayload({ title: `B6 Hiring Posting ${RUN_ID}`, status: "PUBLISHED" }),
      }),
    );
    expect(published.status).toBe(201);
    state.publishedPostingId = (await parseEnvelope(published)).data.id;
    postingIds.push(state.publishedPostingId);

    const draft = await createPosting(
      buildRequest(API, {
        method: "POST",
        cookie: admin.cookie,
        body: postingPayload({ title: `B6 Hidden Posting ${RUN_ID}` }),
      }),
    );
    expect(draft.status).toBe(201);
    state.hiddenDraftPostingId = (await parseEnvelope(draft)).data.id;
    postingIds.push(state.hiddenDraftPostingId);
  });

  test("applying requires login and a published, live posting", async () => {
    const anonymous = await applyToJob(
      buildRequest(`${API}/${state.publishedPostingId}/applications`, { method: "POST", body: {} }),
      ctx({ id: state.publishedPostingId }),
    );
    expect(anonymous.status).toBe(401);

    const toDraft = await applyToJob(
      buildRequest(`${API}/${state.hiddenDraftPostingId}/applications`, {
        method: "POST",
        cookie: applicant.cookie,
        body: {},
      }),
      ctx({ id: state.hiddenDraftPostingId }),
    );
    expect(toDraft.status).toBe(400);

    const unknownJob = await applyToJob(
      buildRequest(`${API}/${crypto.randomUUID()}/applications`, {
        method: "POST",
        cookie: applicant.cookie,
        body: {},
      }),
      ctx({ id: crypto.randomUUID() }),
    );
    expect(unknownJob.status).toBe(404);

    const badBody = await applyToJob(
      buildRequest(`${API}/${state.publishedPostingId}/applications`, {
        method: "POST",
        cookie: applicant.cookie,
        body: { portfolioUrl: "not-a-url" },
      }),
      ctx({ id: state.publishedPostingId }),
    );
    expect(badBody.status).toBe(422);
  });

  test("applicant applies to a published posting; counter increments", async () => {
    const res = await applyToJob(
      buildRequest(`${API}/${state.publishedPostingId}/applications`, {
        method: "POST",
        cookie: applicant.cookie,
        body: {
          coverLetter: "I would love to write tests for this team.",
          portfolioUrl: "https://example.com/portfolio",
          salaryExpectation: 72000,
          availability: "Two weeks notice",
        },
      }),
      ctx({ id: state.publishedPostingId }),
    );
    expect(res.status).toBe(201);
    const { data } = await parseEnvelope(res);
    state.applicantApplicationId = data.id;
    expect(data.status).toBe("PENDING");
    expect(data.userId).toBe(applicant.userId);
    expect(data.jobTitle).toBe(`B6 Hiring Posting ${RUN_ID}`);

    const posting = await parseEnvelope(
      await getPosting(
        buildRequest(`${API}/${state.publishedPostingId}`, { cookie: admin.cookie }),
        ctx({ id: state.publishedPostingId }),
      ),
    );
    expect(posting.data.applicationCount).toBe(1);
  });

  test("duplicate application is rejected with 409", async () => {
    const res = await applyToJob(
      buildRequest(`${API}/${state.publishedPostingId}/applications`, {
        method: "POST",
        cookie: applicant.cookie,
        body: {},
      }),
      ctx({ id: state.publishedPostingId }),
    );
    expect(res.status).toBe(409);
  });

  test("any account role can apply (member applies too)", async () => {
    const res = await applyToJob(
      buildRequest(`${API}/${state.publishedPostingId}/applications`, {
        method: "POST",
        cookie: member.cookie,
        body: {},
      }),
      ctx({ id: state.publishedPostingId }),
    );
    expect(res.status).toBe(201);
    state.memberApplicationId = (await parseEnvelope(res)).data.id;

    const posting = await parseEnvelope(
      await getPosting(
        buildRequest(`${API}/${state.publishedPostingId}`, { cookie: admin.cookie }),
        ctx({ id: state.publishedPostingId }),
      ),
    );
    expect(posting.data.applicationCount).toBe(2);
  });

  test("application deadline in the past blocks new applications", async () => {
    const created = await createPosting(
      buildRequest(API, {
        method: "POST",
        cookie: admin.cookie,
        body: postingPayload({
          title: `B6 Expired Posting ${RUN_ID}`,
          status: "PUBLISHED",
          applicationDeadline: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
        }),
      }),
    );
    expect(created.status).toBe(201);
    const expiredId = (await parseEnvelope(created)).data.id;
    postingIds.push(expiredId);
    state.expiredPostingId = expiredId;

    const res = await applyToJob(
      buildRequest(`${API}/${expiredId}/applications`, {
        method: "POST",
        cookie: applicant2.cookie,
        body: {},
      }),
      ctx({ id: expiredId }),
    );
    expect(res.status).toBe(400);
  });
});
