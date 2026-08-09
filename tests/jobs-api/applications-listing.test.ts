/**
 * Jobs API — application listing: the per-posting list's jobs:read
 * requirement and applicant hydration, plus the global list's jobId and
 * status filters. Route handlers are called directly; shared fixtures and
 * RUN_ID isolation live in ./helpers.
 */

import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { POST as createPosting } from "@/app/api/v1/jobs/route";
import { GET as listAllApplications } from "@/app/api/v1/jobs/applications/route";
import {
  GET as listJobApplications,
  POST as applyToJob,
} from "@/app/api/v1/jobs/[id]/applications/route";
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

beforeAll(async () => {
  ({ admin, staff, member, applicant } = await setup());

  // One published posting with an applicant and a member application, both
  // PENDING — the listing tests below assert against exactly these two rows.
  const published = await createPosting(
    buildRequest(API, {
      method: "POST",
      cookie: admin.cookie,
      body: postingPayload({ title: `B6 Hiring Posting ${RUN_ID}`, status: "PUBLISHED" }),
    }),
  );
  if (published.status !== 201) {
    throw new Error(`fixture posting creation failed: ${published.status}`);
  }
  state.publishedPostingId = (await parseEnvelope(published)).data.id;
  postingIds.push(state.publishedPostingId);

  await seedApplication("applicantApplicationId", applicant.cookie, {
    coverLetter: "I would love to write tests for this team.",
    portfolioUrl: "https://example.com/portfolio",
    salaryExpectation: 72000,
    availability: "Two weeks notice",
  });
  await seedApplication("memberApplicationId", member.cookie);
});

afterAll(async () => {
  await teardown();
});

/** Local factory: POSTs a PENDING application on the posting and records its id. */
async function seedApplication(
  key: string,
  cookie: string,
  body: Record<string, unknown> = {},
): Promise<void> {
  const res = await applyToJob(
    buildRequest(`${API}/${state.publishedPostingId}/applications`, {
      method: "POST",
      cookie,
      body,
    }),
    ctx({ id: state.publishedPostingId }),
  );
  if (res.status !== 201) {
    throw new Error(`fixture application creation failed: ${res.status}`);
  }
  state[key] = (await parseEnvelope(res)).data.id;
}

describe("job application listing", () => {
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
});
