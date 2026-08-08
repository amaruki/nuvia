/**
 * B6 — Jobs API integration tests: status lifecycle, invalid transitions, withdrawal, and the mine endpoint.
 *
 * Runs against the shared test database (DATABASE_URL from .env). Every row
 * this file creates is id-isolated by RUN_ID and removed in afterAll, so the
 * suite is self-cleaning and safe to run alongside other test files.
 */

import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { POST as createPosting } from "@/app/api/v1/jobs/route";
import { GET as listMyApplications } from "@/app/api/v1/jobs/applications/mine/route";
import { POST as applyToJob } from "@/app/api/v1/jobs/[id]/applications/route";
import {
  GET as getApplication,
  PATCH as updateApplication,
} from "@/app/api/v1/jobs/[id]/applications/[applicationId]/route";
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

  // One published posting with an applicant and a member application, both
  // PENDING — the lifecycle and transition tests below mutate them in order.
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

  const applicantApplied = await applyToJob(
    buildRequest(`${API}/${state.publishedPostingId}/applications`, {
      method: "POST",
      cookie: applicant.cookie,
      body: {},
    }),
    ctx({ id: state.publishedPostingId }),
  );
  if (applicantApplied.status !== 201) {
    throw new Error(`fixture applicant application failed: ${applicantApplied.status}`);
  }
  state.applicantApplicationId = (await parseEnvelope(applicantApplied)).data.id;

  const memberApplied = await applyToJob(
    buildRequest(`${API}/${state.publishedPostingId}/applications`, {
      method: "POST",
      cookie: member.cookie,
      body: {},
    }),
    ctx({ id: state.publishedPostingId }),
  );
  if (memberApplied.status !== 201) {
    throw new Error(`fixture member application failed: ${memberApplied.status}`);
  }
  state.memberApplicationId = (await parseEnvelope(memberApplied)).data.id;
});

afterAll(async () => {
  await teardown();
});

describe("job application status flow", () => {
  test("full status lifecycle: PENDING → REVIEWING → SHORTLISTED → INTERVIEWING → OFFERED → HIRED", async () => {
    const applicationParams = {
      id: state.publishedPostingId,
      applicationId: state.applicantApplicationId,
    };
    const lifecycle = ["REVIEWING", "SHORTLISTED", "INTERVIEWING", "OFFERED", "HIRED"];

    for (const [index, status] of lifecycle.entries()) {
      const res = await updateApplication(
        buildRequest(
          `${API}/${applicationParams.id}/applications/${applicationParams.applicationId}`,
          {
            method: "PATCH",
            cookie: admin.cookie,
            body: index === 0 ? { status, notes: "Strong cover letter" } : { status },
          },
        ),
        ctx(applicationParams),
      );
      expect(res.status).toBe(200);
      const { data } = await parseEnvelope(res);
      expect(data.status).toBe(status);
      if (index === 0) {
        expect(data.notes).toBe("Strong cover letter");
      }
    }

    // Verify persistence through the detail endpoint.
    const detail = await parseEnvelope(
      await getApplication(
        buildRequest(
          `${API}/${applicationParams.id}/applications/${applicationParams.applicationId}`,
          { cookie: admin.cookie },
        ),
        ctx(applicationParams),
      ),
    );
    expect(detail.data.status).toBe("HIRED");
  });

  test("invalid transitions are rejected with 409", async () => {
    const hiredParams = {
      id: state.publishedPostingId,
      applicationId: state.applicantApplicationId,
    };
    const fromTerminal = await updateApplication(
      buildRequest(`${API}/${hiredParams.id}/applications/${hiredParams.applicationId}`, {
        method: "PATCH",
        cookie: admin.cookie,
        body: { status: "PENDING" },
      }),
      ctx(hiredParams),
    );
    expect(fromTerminal.status).toBe(409);

    // PENDING cannot jump straight to HIRED.
    const memberParams = { id: state.publishedPostingId, applicationId: state.memberApplicationId };
    const skipping = await updateApplication(
      buildRequest(`${API}/${memberParams.id}/applications/${memberParams.applicationId}`, {
        method: "PATCH",
        cookie: admin.cookie,
        body: { status: "HIRED" },
      }),
      ctx(memberParams),
    );
    expect(skipping.status).toBe(409);
  });

  test("staff can transition (jobs:update), member cannot", async () => {
    const memberParams = { id: state.publishedPostingId, applicationId: state.memberApplicationId };

    const byStaff = await updateApplication(
      buildRequest(`${API}/${memberParams.id}/applications/${memberParams.applicationId}`, {
        method: "PATCH",
        cookie: staff.cookie,
        body: { status: "REVIEWING" },
      }),
      ctx(memberParams),
    );
    expect(byStaff.status).toBe(200);

    const byMember = await updateApplication(
      buildRequest(`${API}/${memberParams.id}/applications/${memberParams.applicationId}`, {
        method: "PATCH",
        cookie: member.cookie,
        body: { status: "SHORTLISTED" },
      }),
      ctx(memberParams),
    );
    expect(byMember.status).toBe(403);
  });

  test("applicants can withdraw their own application and nothing else", async () => {
    const applied = await applyToJob(
      buildRequest(`${API}/${state.publishedPostingId}/applications`, {
        method: "POST",
        cookie: applicant2.cookie,
        body: { coverLetter: "Second applicant here." },
      }),
      ctx({ id: state.publishedPostingId }),
    );
    expect(applied.status).toBe(201);
    const ownParams = {
      id: state.publishedPostingId,
      applicationId: (await parseEnvelope(applied)).data.id,
    };

    // Cannot advance someone else's application.
    const someoneElses = { id: state.publishedPostingId, applicationId: state.memberApplicationId };
    const touchOthers = await updateApplication(
      buildRequest(`${API}/${someoneElses.id}/applications/${someoneElses.applicationId}`, {
        method: "PATCH",
        cookie: applicant2.cookie,
        body: { status: "WITHDRAWN" },
      }),
      ctx(someoneElses),
    );
    expect(touchOthers.status).toBe(403);

    // Cannot self-promote.
    const selfPromote = await updateApplication(
      buildRequest(`${API}/${ownParams.id}/applications/${ownParams.applicationId}`, {
        method: "PATCH",
        cookie: applicant2.cookie,
        body: { status: "REVIEWING" },
      }),
      ctx(ownParams),
    );
    expect(selfPromote.status).toBe(403);

    // Withdrawal works.
    const withdraw = await updateApplication(
      buildRequest(`${API}/${ownParams.id}/applications/${ownParams.applicationId}`, {
        method: "PATCH",
        cookie: applicant2.cookie,
        body: { status: "WITHDRAWN" },
      }),
      ctx(ownParams),
    );
    expect(withdraw.status).toBe(200);
    expect((await parseEnvelope(withdraw)).data.status).toBe("WITHDRAWN");

    // WITHDRAWN is terminal — even for admins.
    const afterWithdrawal = await updateApplication(
      buildRequest(`${API}/${ownParams.id}/applications/${ownParams.applicationId}`, {
        method: "PATCH",
        cookie: admin.cookie,
        body: { status: "REVIEWING" },
      }),
      ctx(ownParams),
    );
    expect(afterWithdrawal.status).toBe(409);
  });

  test("mine endpoint lists the caller's own applications", async () => {
    const anonymous = await listMyApplications(buildRequest(`${API}/applications/mine`));
    expect(anonymous.status).toBe(401);

    const asApplicant2 = await listMyApplications(
      buildRequest(`${API}/applications/mine`, { cookie: applicant2.cookie }),
    );
    expect(asApplicant2.status).toBe(200);
    const { data } = await parseEnvelope(asApplicant2);
    expect(data.length).toBe(1);
    expect(data[0].userId).toBe(applicant2.userId);
    expect(data[0].status).toBe("WITHDRAWN");
    expect(data[0].jobTitle).toBe(`B6 Hiring Posting ${RUN_ID}`);
  });
});
