/**
 * B6 — Jobs API integration tests: applying to postings, listing applications, and detail access.
 *
 * Runs against the shared test database (DATABASE_URL from .env). Every row
 * this file creates is id-isolated by RUN_ID and removed in afterAll, so the
 * suite is self-cleaning and safe to run alongside other test files.
 */

import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { POST as createPosting } from "@/app/api/v1/jobs/route";
import { GET as getPosting } from "@/app/api/v1/jobs/[id]/route";
import { GET as listAllApplications } from "@/app/api/v1/jobs/applications/route";
import {
  GET as listJobApplications,
  POST as applyToJob,
} from "@/app/api/v1/jobs/[id]/applications/route";
import { GET as getApplication } from "@/app/api/v1/jobs/[id]/applications/[applicationId]/route";
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
let staff = { userId: "", cookie: "" };
let member = { userId: "", cookie: "" };
let applicant = { userId: "", cookie: "" };
let applicant2 = { userId: "", cookie: "" };

beforeAll(async () => {
  ({ admin, staff, member, applicant, applicant2 } = await setup());
});

afterAll(async () => {
  await teardown();
});

describe("job applications", () => {
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

  test("listing applications for a posting requires jobs:read", async () => {
    const asStaff = await listJobApplications(
      buildRequest(`${API}/${state.publishedPostingId}/applications`, { cookie: staff.cookie }),
      ctx({ id: state.publishedPostingId }),
    );
    expect(asStaff.status).toBe(200);
    const body = await parseEnvelope(asStaff);
    expect(body.meta.total).toBe(2);
    const item = body.data.find((a: any) => a.id === state.applicantApplicationId);
    expect(item.applicantName).toBeTruthy();
    expect(item.applicantEmail).toContain("@");

    const asMember = await listJobApplications(
      buildRequest(`${API}/${state.publishedPostingId}/applications`, { cookie: member.cookie }),
      ctx({ id: state.publishedPostingId }),
    );
    expect(asMember.status).toBe(403);

    const asOwnerWithoutPermission = await listJobApplications(
      buildRequest(`${API}/${state.publishedPostingId}/applications`, { cookie: applicant.cookie }),
      ctx({ id: state.publishedPostingId }),
    );
    expect(asOwnerWithoutPermission.status).toBe(403);
  });

  test("global applications list filters by jobId and status", async () => {
    const byJob = await listAllApplications(
      buildRequest(`${API}/applications?jobId=${state.publishedPostingId}`, {
        cookie: admin.cookie,
      }),
    );
    expect(byJob.status).toBe(200);
    const ids = (await parseEnvelope(byJob)).data.map((a: any) => a.id);
    expect(ids).toContain(state.applicantApplicationId);
    expect(ids).toContain(state.memberApplicationId);

    const pending = await listAllApplications(
      buildRequest(`${API}/applications?jobId=${state.publishedPostingId}&status=PENDING`, {
        cookie: admin.cookie,
      }),
    );
    expect(pending.status).toBe(200);
    const pendingBody = await parseEnvelope(pending);
    expect(pendingBody.data.length).toBeGreaterThanOrEqual(2);
    expect(pendingBody.data.every((a: any) => a.status === "PENDING")).toBe(true);
  });

  test("application detail: admin and owner can read, others cannot", async () => {
    const applicationParams = {
      id: state.publishedPostingId,
      applicationId: state.applicantApplicationId,
    };

    const asAdmin = await getApplication(
      buildRequest(
        `${API}/${applicationParams.id}/applications/${applicationParams.applicationId}`,
        { cookie: admin.cookie },
      ),
      ctx(applicationParams),
    );
    expect(asAdmin.status).toBe(200);

    const asOwner = await getApplication(
      buildRequest(
        `${API}/${applicationParams.id}/applications/${applicationParams.applicationId}`,
        { cookie: applicant.cookie },
      ),
      ctx(applicationParams),
    );
    expect(asOwner.status).toBe(200);
    expect((await parseEnvelope(asOwner)).data.coverLetter).toContain("write tests");

    const asStranger = await getApplication(
      buildRequest(
        `${API}/${applicationParams.id}/applications/${applicationParams.applicationId}`,
        { cookie: applicant2.cookie },
      ),
      ctx(applicationParams),
    );
    expect(asStranger.status).toBe(403);

    const anonymous = await getApplication(
      buildRequest(
        `${API}/${applicationParams.id}/applications/${applicationParams.applicationId}`,
      ),
      ctx(applicationParams),
    );
    expect(anonymous.status).toBe(401);

    const unknownParams = { id: state.publishedPostingId, applicationId: crypto.randomUUID() };
    const unknown = await getApplication(
      buildRequest(`${API}/${unknownParams.id}/applications/${unknownParams.applicationId}`, {
        cookie: admin.cookie,
      }),
      ctx(unknownParams),
    );
    expect(unknown.status).toBe(404);
  });
});
