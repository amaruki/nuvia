/**
 * B6 — Jobs API integration tests.
 *
 * Covers postings CRUD, the board metadata endpoint, and the full application
 * status flow (PENDING → … → HIRED plus withdrawal and invalid transitions).
 *
 * Runs against the shared test database (DATABASE_URL from .env). Every row
 * this file creates is id-isolated by RUN_ID and removed in afterAll, so the
 * suite is self-cleaning and safe to run alongside other test files.
 */

import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { eq, inArray } from "drizzle-orm";
import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db/client";
import {
  company,
  jobApplication,
  jobCategory,
  jobPosting,
  jobType,
  location,
  user,
} from "@/db/schema";
import { testIp } from "./helpers";

import { GET as listPostings, POST as createPosting } from "@/app/api/v1/jobs/route";
import { GET as getBoardMeta } from "@/app/api/v1/jobs/meta/route";
import {
  DELETE as deletePosting,
  GET as getPosting,
  PATCH as updatePosting,
} from "@/app/api/v1/jobs/[id]/route";
import { GET as listAllApplications } from "@/app/api/v1/jobs/applications/route";
import { GET as listMyApplications } from "@/app/api/v1/jobs/applications/mine/route";
import {
  GET as listJobApplications,
  POST as applyToJob,
} from "@/app/api/v1/jobs/[id]/applications/route";
import {
  GET as getApplication,
  PATCH as updateApplication,
} from "@/app/api/v1/jobs/[id]/applications/[applicationId]/route";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const RUN_ID = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const PASSWORD = "Sup3r-Secret-Passw0rd!";
const API = "http://localhost:3000/api/v1/jobs";

const refs = { categoryId: "", typeId: "", locationId: "", companyId: "" };
const userIds: string[] = [];
const postingIds: string[] = [];

/** Values shared between ordered tests within this file. */
const state: Record<string, string> = {};

interface RequestOptions {
  method?: string;
  cookie?: string;
  body?: unknown;
}

function buildRequest(url: string, options: RequestOptions = {}): NextRequest {
  const headers = new Headers();
  headers.set("x-forwarded-for", testIp());
  if (options.cookie) headers.set("cookie", options.cookie);
  if (options.body !== undefined) headers.set("content-type", "application/json");
  return new NextRequest(url, {
    method: options.method ?? "GET",
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });
}

function ctx<T extends Record<string, string>>(params: T): { params: Promise<T> } {
  return { params: Promise.resolve(params) };
}

async function parseEnvelope(res: Response) {
  return (await res.json()) as { data: any; meta?: any };
}

async function signUpWithRole(label: string, role: string | null) {
  const email = `jobs-b6-${label}-${RUN_ID}@example.test`;
  const username = `jobs-b6-${label}-${RUN_ID}`;

  const res = await auth.handler(
    new Request("http://localhost:3000/api/auth/sign-up/email", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": testIp() },
      body: JSON.stringify({ email, password: PASSWORD, name: `Jobs B6 ${label}`, username }),
    }),
  );
  const body = (await res.json()) as { user?: { id: string } };
  if (!res.ok || !body.user) {
    throw new Error(`sign-up failed for ${label}: ${res.status} ${JSON.stringify(body)}`);
  }
  userIds.push(body.user.id);

  let cookie = res.headers
    .getSetCookie()
    .map((c) => c.split(";")[0])
    .join("; ");

  if (role) {
    await db.update(user).set({ role }).where(eq(user.id, body.user.id));
    // Fresh session so the new role is definitely visible to getSession.
    const signIn = await auth.handler(
      new Request("http://localhost:3000/api/auth/sign-in/email", {
        method: "POST",
        headers: { "content-type": "application/json", "x-forwarded-for": testIp() },
        body: JSON.stringify({ email, password: PASSWORD }),
      }),
    );
    if (!signIn.ok) throw new Error(`sign-in failed for ${label}: ${signIn.status}`);
    cookie = signIn.headers
      .getSetCookie()
      .map((c) => c.split(";")[0])
      .join("; ");
  }

  return { userId: body.user.id, cookie };
}

function postingPayload(overrides: Record<string, unknown> = {}) {
  return {
    title: `B6 Test Posting ${RUN_ID}`,
    description: "A test job description that is long enough to pass validation.",
    requirements: "Must enjoy writing tests.",
    categoryId: refs.categoryId,
    typeId: refs.typeId,
    locationId: refs.locationId,
    companyId: refs.companyId,
    employmentType: "FULL_TIME",
    experienceLevel: "MID_LEVEL",
    salaryMin: 60000,
    salaryMax: 80000,
    currency: "USD",
    tags: ["b6-test"],
    ...overrides,
  };
}

let admin = { userId: "", cookie: "" };
let staff = { userId: "", cookie: "" };
let member = { userId: "", cookie: "" };
let applicant = { userId: "", cookie: "" };
let applicant2 = { userId: "", cookie: "" };

beforeAll(async () => {
  const [categoryRow] = await db
    .insert(jobCategory)
    .values({ name: `jobs-b6-cat-${RUN_ID}`, displayName: `B6 Test Category ${RUN_ID}` })
    .returning();
  const [typeRow] = await db
    .insert(jobType)
    .values({ name: `jobs-b6-type-${RUN_ID}`, displayName: `B6 Test Type ${RUN_ID}` })
    .returning();
  const [locationRow] = await db
    .insert(location)
    .values({ name: `jobs-b6-loc-${RUN_ID}`, displayName: `B6 Testville ${RUN_ID}` })
    .returning();
  const [companyRow] = await db
    .insert(company)
    .values({ name: `jobs-b6-co-${RUN_ID}`, displayName: `B6 Test Corp ${RUN_ID}` })
    .returning();

  refs.categoryId = categoryRow!.id;
  refs.typeId = typeRow!.id;
  refs.locationId = locationRow!.id;
  refs.companyId = companyRow!.id;

  [admin, staff, member, applicant, applicant2] = await Promise.all([
    signUpWithRole("admin", "admin"),
    signUpWithRole("staff", "staff"),
    signUpWithRole("member", "member"),
    signUpWithRole("applicant", null),
    signUpWithRole("applicant2", null),
  ]);
});

afterAll(async () => {
  // Order matters: applications reference postings, postings reference the
  // reference tables, and the users we created posted/applied to them.
  if (postingIds.length > 0) {
    await db.delete(jobApplication).where(inArray(jobApplication.jobId, postingIds));
    await db.delete(jobPosting).where(inArray(jobPosting.id, postingIds));
  }
  await db.delete(jobCategory).where(eq(jobCategory.id, refs.categoryId));
  await db.delete(jobType).where(eq(jobType.id, refs.typeId));
  await db.delete(location).where(eq(location.id, refs.locationId));
  await db.delete(company).where(eq(company.id, refs.companyId));
  if (userIds.length > 0) {
    await db.delete(user).where(inArray(user.id, userIds));
  }
});

// ---------------------------------------------------------------------------
// Postings CRUD
// ---------------------------------------------------------------------------

describe("job postings CRUD", () => {
  test("listing and creating require authentication and jobs permissions", async () => {
    expect((await listPostings(buildRequest(API))).status).toBe(401);
    expect((await listPostings(buildRequest(API, { cookie: member.cookie }))).status).toBe(403);

    expect(
      (await createPosting(buildRequest(API, { method: "POST", body: postingPayload() }))).status,
    ).toBe(401);
    expect(
      (
        await createPosting(
          buildRequest(API, { method: "POST", cookie: member.cookie, body: postingPayload() }),
        )
      ).status,
    ).toBe(403);
    // staff holds jobs:read/update/manage/approve but not jobs:create
    expect(
      (
        await createPosting(
          buildRequest(API, { method: "POST", cookie: staff.cookie, body: postingPayload() }),
        )
      ).status,
    ).toBe(403);
  });

  test("create validates the payload and reference rows", async () => {
    const empty = await createPosting(
      buildRequest(API, { method: "POST", cookie: admin.cookie, body: {} }),
    );
    expect(empty.status).toBe(422);

    const badEnum = await createPosting(
      buildRequest(API, {
        method: "POST",
        cookie: admin.cookie,
        body: postingPayload({ employmentType: "HOBBY" }),
      }),
    );
    expect(badEnum.status).toBe(422);

    const danglingReference = await createPosting(
      buildRequest(API, {
        method: "POST",
        cookie: admin.cookie,
        body: postingPayload({ categoryId: crypto.randomUUID() }),
      }),
    );
    expect(danglingReference.status).toBe(422);
    const problemBody = (await danglingReference.json()) as { errors?: { field: string }[] };
    expect(problemBody.errors?.some((e) => e.field === "categoryId")).toBe(true);
  });

  test("admin creates a draft posting with joined reference names", async () => {
    const res = await createPosting(
      buildRequest(API, { method: "POST", cookie: admin.cookie, body: postingPayload() }),
    );
    expect(res.status).toBe(201);

    const { data } = await parseEnvelope(res);
    state.draftPostingId = data.id;
    postingIds.push(data.id);

    expect(data.status).toBe("DRAFT");
    expect(data.slug.length).toBeGreaterThan(0);
    expect(data.categoryName).toBe(`B6 Test Category ${RUN_ID}`);
    expect(data.typeName).toBe(`B6 Test Type ${RUN_ID}`);
    expect(data.locationName).toBe(`B6 Testville ${RUN_ID}`);
    expect(data.companyName).toBe(`B6 Test Corp ${RUN_ID}`);
    expect(data.salaryMin).toBe(60000);
    expect(data.salaryMax).toBe(80000);
    expect(data.applicationCount).toBe(0);
    expect(data.publishedAt).toBeNull();

    // Same title again → unique slug, no collision.
    const second = await createPosting(
      buildRequest(API, { method: "POST", cookie: admin.cookie, body: postingPayload() }),
    );
    expect(second.status).toBe(201);
    const secondBody = await parseEnvelope(second);
    state.secondDraftPostingId = secondBody.data.id;
    postingIds.push(secondBody.data.id);
    expect(secondBody.data.slug).not.toBe(data.slug);
  });

  test("listing supports status/search filters and pagination meta", async () => {
    const all = await listPostings(
      buildRequest(`${API}?search=${RUN_ID}`, { cookie: admin.cookie }),
    );
    expect(all.status).toBe(200);
    const allBody = await parseEnvelope(all);
    const ids = allBody.data.map((item: any) => item.id);
    expect(ids).toContain(state.draftPostingId);
    expect(ids).toContain(state.secondDraftPostingId);
    expect(allBody.meta.total).toBeGreaterThanOrEqual(2);
    expect(allBody.meta.page).toBe(1);
    expect(allBody.meta.totalPages).toBeGreaterThanOrEqual(1);

    const drafts = await listPostings(
      buildRequest(`${API}?status=DRAFT&search=${RUN_ID}`, { cookie: staff.cookie }),
    );
    expect(drafts.status).toBe(200);
    expect((await parseEnvelope(drafts)).data.length).toBeGreaterThanOrEqual(2);

    const published = await listPostings(
      buildRequest(`${API}?status=PUBLISHED&search=${RUN_ID}`, { cookie: admin.cookie }),
    );
    expect(published.status).toBe(200);
    const publishedIds = (await parseEnvelope(published)).data.map((item: any) => item.id);
    expect(publishedIds).not.toContain(state.draftPostingId);
  });

  test("fetching a single posting respects jobs:read", async () => {
    const asStaff = await getPosting(
      buildRequest(`${API}/${state.draftPostingId}`, { cookie: staff.cookie }),
      ctx({ id: state.draftPostingId }),
    );
    expect(asStaff.status).toBe(200);
    expect((await parseEnvelope(asStaff)).data.id).toBe(state.draftPostingId);

    const asMember = await getPosting(
      buildRequest(`${API}/${state.draftPostingId}`, { cookie: member.cookie }),
      ctx({ id: state.draftPostingId }),
    );
    expect(asMember.status).toBe(403);

    const unknown = await getPosting(
      buildRequest(`${API}/${crypto.randomUUID()}`, { cookie: admin.cookie }),
      ctx({ id: crypto.randomUUID() }),
    );
    expect(unknown.status).toBe(404);
  });

  test("update: staff can edit, member cannot, invalid salary range rejected", async () => {
    const before = await parseEnvelope(
      await getPosting(
        buildRequest(`${API}/${state.draftPostingId}`, { cookie: admin.cookie }),
        ctx({ id: state.draftPostingId }),
      ),
    );

    const byStaff = await updatePosting(
      buildRequest(`${API}/${state.draftPostingId}`, {
        method: "PATCH",
        cookie: staff.cookie,
        body: { title: `B6 Updated Posting ${RUN_ID}` },
      }),
      ctx({ id: state.draftPostingId }),
    );
    expect(byStaff.status).toBe(200);
    const updated = await parseEnvelope(byStaff);
    expect(updated.data.title).toBe(`B6 Updated Posting ${RUN_ID}`);
    expect(updated.data.slug).toBe(before.data.slug); // slug stable across title edits

    const byMember = await updatePosting(
      buildRequest(`${API}/${state.draftPostingId}`, {
        method: "PATCH",
        cookie: member.cookie,
        body: { title: "Nope" },
      }),
      ctx({ id: state.draftPostingId }),
    );
    expect(byMember.status).toBe(403);

    const badSalary = await updatePosting(
      buildRequest(`${API}/${state.draftPostingId}`, {
        method: "PATCH",
        cookie: admin.cookie,
        body: { salaryMin: 90000, salaryMax: 10000 },
      }),
      ctx({ id: state.draftPostingId }),
    );
    expect(badSalary.status).toBe(422);

    const unknown = await updatePosting(
      buildRequest(`${API}/${crypto.randomUUID()}`, {
        method: "PATCH",
        cookie: admin.cookie,
        body: { title: "Ghost" },
      }),
      ctx({ id: crypto.randomUUID() }),
    );
    expect(unknown.status).toBe(404);
  });

  test("publishing sets publishedAt", async () => {
    const res = await updatePosting(
      buildRequest(`${API}/${state.draftPostingId}`, {
        method: "PATCH",
        cookie: admin.cookie,
        body: { status: "PUBLISHED" },
      }),
      ctx({ id: state.draftPostingId }),
    );
    expect(res.status).toBe(200);
    expect((await parseEnvelope(res)).data.publishedAt).not.toBeNull();
  });

  test("meta endpoint exposes the reference tables", async () => {
    expect((await getBoardMeta(buildRequest(`${API}/meta`))).status).toBe(401);
    expect(
      (await getBoardMeta(buildRequest(`${API}/meta`, { cookie: member.cookie }))).status,
    ).toBe(403);

    const res = await getBoardMeta(buildRequest(`${API}/meta`, { cookie: staff.cookie }));
    expect(res.status).toBe(200);
    const { data } = await parseEnvelope(res);
    expect(data.categories.some((c: any) => c.id === refs.categoryId)).toBe(true);
    expect(data.types.some((t: any) => t.id === refs.typeId)).toBe(true);
    expect(data.locations.some((l: any) => l.id === refs.locationId)).toBe(true);
    expect(data.companies.some((c: any) => c.id === refs.companyId)).toBe(true);
  });

  test("delete: staff cannot, admin can, and the posting is gone", async () => {
    const created = await createPosting(
      buildRequest(API, {
        method: "POST",
        cookie: admin.cookie,
        body: postingPayload({ title: `B6 Doomed Posting ${RUN_ID}` }),
      }),
    );
    expect(created.status).toBe(201);
    const doomedId = (await parseEnvelope(created)).data.id;
    postingIds.push(doomedId);

    const byStaff = await deletePosting(
      buildRequest(`${API}/${doomedId}`, { method: "DELETE", cookie: staff.cookie }),
      ctx({ id: doomedId }),
    );
    expect(byStaff.status).toBe(403);

    const byAdmin = await deletePosting(
      buildRequest(`${API}/${doomedId}`, { method: "DELETE", cookie: admin.cookie }),
      ctx({ id: doomedId }),
    );
    expect(byAdmin.status).toBe(200);

    const gone = await getPosting(
      buildRequest(`${API}/${doomedId}`, { cookie: admin.cookie }),
      ctx({ id: doomedId }),
    );
    expect(gone.status).toBe(404);

    const again = await deletePosting(
      buildRequest(`${API}/${doomedId}`, { method: "DELETE", cookie: admin.cookie }),
      ctx({ id: doomedId }),
    );
    expect(again.status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// Applications
// ---------------------------------------------------------------------------

describe("job applications flow", () => {
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
