/**
 * Awards API — program listing: envelope/meta, status/category filters, and
 * pagination over the RUN_ID baseline delta (backlog D4). Route handlers are
 * called directly; shared fixtures live in ./helpers.
 */

import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { GET as listPrograms, POST as createProgram } from "@/app/api/v1/awards/programs/route";
import {
  buildRequest,
  newRunId,
  parseJson,
  PROGRAMS_API,
  programPayload,
  signUpWithRole,
  sweepFixtures,
  type ListMeta,
  type TestUser,
  type WireProgram,
} from "./helpers";

const RUN_ID = newRunId();

const userIds: string[] = [];
const programIds: string[] = [];

let admin: TestUser = { userId: "", email: "", cookie: "" };
let staff: TestUser = { userId: "", email: "", cookie: "" };

beforeAll(async () => {
  [admin, staff] = await Promise.all([
    signUpWithRole(RUN_ID, "admin", "admin", userIds),
    signUpWithRole(RUN_ID, "staff", "staff", userIds),
  ]);
});

afterAll(async () => {
  await sweepFixtures(RUN_ID, programIds, userIds);
});

describe("award program listing", () => {
  beforeAll(async () => {
    // Seed three programs with distinct statuses/categories for filters.
    for (const [suffix, status, category] of [
      ["alpha", "open", "achievement"],
      ["beta", "draft", "scholarship"],
      ["gamma", "closed", "service"],
    ] as const) {
      const res = await createProgram(
        buildRequest(PROGRAMS_API, {
          method: "POST",
          cookie: admin.cookie,
          body: programPayload(RUN_ID, suffix, { status, category }),
        }),
      );
      const envelope = await parseJson<{ data: WireProgram }>(res);
      programIds.push(envelope.data.id);
    }
  });

  test("list returns the envelope with meta for the RUN_ID delta", async () => {
    const res = await listPrograms(
      buildRequest(`${PROGRAMS_API}?search=${RUN_ID}&limit=100`, { cookie: admin.cookie }),
    );
    expect(res.status).toBe(200);

    const envelope = await parseJson<{ data: WireProgram[]; meta: ListMeta }>(res);
    expect(Array.isArray(envelope.data)).toBe(true);
    // Baseline delta: nothing matched RUN_ID before this run created rows.
    expect(envelope.data.length).toBe(3);
    expect(envelope.meta.page).toBe(1);
    expect(envelope.meta.limit).toBe(100);
    expect(envelope.meta.total).toBe(3);
    expect(envelope.meta.totalPages).toBe(1);

    const names = envelope.data.map((row) => row.name).sort();
    expect(names).toEqual([
      `d4-program-alpha-${RUN_ID}`,
      `d4-program-beta-${RUN_ID}`,
      `d4-program-gamma-${RUN_ID}`,
    ]);
  });

  test("status filter narrows the delta (csv supported)", async () => {
    const res = await listPrograms(
      buildRequest(`${PROGRAMS_API}?search=${RUN_ID}&status=draft,closed`, {
        cookie: admin.cookie,
      }),
    );
    const envelope = await parseJson<{ data: WireProgram[] }>(res);
    expect(envelope.data.length).toBe(2);
    const statuses = envelope.data.map((row) => row.status).sort();
    expect(statuses).toEqual(["closed", "draft"]);
  });

  test("category filter narrows the delta", async () => {
    const res = await listPrograms(
      buildRequest(`${PROGRAMS_API}?search=${RUN_ID}&category=scholarship`, {
        cookie: admin.cookie,
      }),
    );
    const envelope = await parseJson<{ data: WireProgram[] }>(res);
    expect(envelope.data.length).toBe(1);
    expect(envelope.data[0].category).toBe("scholarship");

    const miss = await listPrograms(
      buildRequest(`${PROGRAMS_API}?search=${RUN_ID}&category=innovation`, {
        cookie: admin.cookie,
      }),
    );
    expect((await parseJson<{ data: WireProgram[] }>(miss)).data.length).toBe(0);
  });

  test("pagination slices the delta", async () => {
    const res = await listPrograms(
      buildRequest(`${PROGRAMS_API}?search=${RUN_ID}&limit=2&page=1`, { cookie: admin.cookie }),
    );
    const envelope = await parseJson<{ data: WireProgram[]; meta: ListMeta }>(res);
    expect(envelope.data.length).toBe(2);
    expect(envelope.meta.limit).toBe(2);
    expect(envelope.meta.total).toBe(3);
    expect(envelope.meta.totalPages).toBe(2);

    const pageTwo = await parseJson<{ data: WireProgram[]; meta: ListMeta }>(
      await listPrograms(
        buildRequest(`${PROGRAMS_API}?search=${RUN_ID}&limit=2&page=2`, { cookie: admin.cookie }),
      ),
    );
    expect(pageTwo.data.length).toBe(1);
  });

  test("staff can list programs", async () => {
    const res = await listPrograms(
      buildRequest(`${PROGRAMS_API}?search=${RUN_ID}`, { cookie: staff.cookie }),
    );
    expect(res.status).toBe(200);
    expect((await parseJson<{ data: WireProgram[] }>(res)).data.length).toBe(3);
  });
});
