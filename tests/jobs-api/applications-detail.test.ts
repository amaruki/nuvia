/**
 * Jobs API — application detail access: admin and owner can read an
 * application, other accounts and anonymous callers cannot, and unknown
 * application ids 404. Route handlers are called directly; shared fixtures
 * and RUN_ID isolation live in ./helpers.
 */

import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { POST as createPosting } from "@/app/api/v1/jobs/route";
import { POST as applyToJob } from "@/app/api/v1/jobs/[id]/applications/route";
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
let applicant = { userId: "", cookie: "" };
let applicant2 = { userId: "", cookie: "" };

beforeAll(async () => {
  ({ admin, applicant, applicant2 } = await setup());

  // One published posting with the applicant's application — the detail
  // test below reads it as admin, owner, stranger, anonymous, and unknown.
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

  await seedApplication();
});

afterAll(async () => {
  await teardown();
});

/** Local factory: POSTs the applicant's PENDING application and records its id. */
async function seedApplication(): Promise<void> {
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
  if (res.status !== 201) {
    throw new Error(`fixture application creation failed: ${res.status}`);
  }
  state.applicantApplicationId = (await parseEnvelope(res)).data.id;
}

describe("job application detail", () => {
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
