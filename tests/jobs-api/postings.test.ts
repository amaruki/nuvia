/**
 * B6 — Jobs API integration tests: postings CRUD and the board metadata endpoint.
 *
 * Runs against the shared test database (DATABASE_URL from .env). Every row
 * this file creates is id-isolated by RUN_ID and removed in afterAll, so the
 * suite is self-cleaning and safe to run alongside other test files.
 */

import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { GET as listPostings, POST as createPosting } from "@/app/api/v1/jobs/route";
import { GET as getBoardMeta } from "@/app/api/v1/jobs/meta/route";
import {
  DELETE as deletePosting,
  GET as getPosting,
  PATCH as updatePosting,
} from "@/app/api/v1/jobs/[id]/route";
import { createJobsApiFixtures } from "./helpers";

const {
  RUN_ID,
  API,
  refs,
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

beforeAll(async () => {
  ({ admin, staff, member } = await setup());
});

afterAll(async () => {
  await teardown();
});

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
