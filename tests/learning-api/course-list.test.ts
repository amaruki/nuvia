/**
 * D3 — course listing: envelope, filters, search, pagination (baseline-delta).
 */

import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import {
  GET as listCoursesRoute,
  POST as createCourseRoute,
} from "@/app/api/v1/learning/courses/route";
import type { Course } from "@/types/learning.types";
import {
  buildRequest,
  cleanupAll,
  COURSES_API,
  coursePayload,
  parseEnvelope,
  RUN_ID,
  signUpWithRole,
  trackCourse,
  type TestUser,
} from "./helpers";

let admin: TestUser = { userId: "", email: "", cookie: "" };

/** Course ids seeded by beforeAll, keyed by suffix. */
const ids: Record<string, string> = {};

beforeAll(async () => {
  admin = await signUpWithRole("cl-admin", "admin");

  // Seed three courses with distinct level/category for filter assertions.
  for (const [suffix, overrides] of [
    ["alpha", {}],
    ["beta", { level: "Intermediate" }],
    ["gamma", { category: `D3 Alternate ${RUN_ID}` }],
  ] as const) {
    const res = await createCourseRoute(
      buildRequest(COURSES_API, {
        method: "POST",
        cookie: admin.cookie,
        body: coursePayload(suffix, overrides),
      }),
    );
    const envelope = await parseEnvelope<Course>(res);
    trackCourse(envelope.data.id);
    ids[`${suffix}Id`] = envelope.data.id;
  }
});

afterAll(cleanupAll);

describe("course listing", () => {
  test("list returns the envelope with meta for the RUN_ID delta", async () => {
    const res = await listCoursesRoute(
      buildRequest(`${COURSES_API}?search=${RUN_ID}&limit=100`, { cookie: admin.cookie }),
    );
    expect(res.status).toBe(200);

    const envelope = await parseEnvelope<Course[]>(res);
    expect(Array.isArray(envelope.data)).toBe(true);
    // Baseline delta: nothing matched RUN_ID before this run created rows.
    expect(envelope.data.length).toBe(3);
    expect(envelope.meta?.page).toBe(1);
    expect(envelope.meta?.limit).toBe(100);
    expect(envelope.meta?.total).toBe(3);
    expect(envelope.meta?.totalPages).toBe(1);

    const titles = envelope.data.map((row) => row.title).sort();
    expect(titles).toEqual([
      `d3-course-alpha-${RUN_ID}`,
      `d3-course-beta-${RUN_ID}`,
      `d3-course-gamma-${RUN_ID}`,
    ]);
  });

  test("level filter narrows the delta", async () => {
    const res = await listCoursesRoute(
      buildRequest(`${COURSES_API}?search=${RUN_ID}&level=Intermediate`, { cookie: admin.cookie }),
    );
    const envelope = await parseEnvelope<Course[]>(res);
    expect(envelope.data.length).toBe(1);
    expect(envelope.data[0]?.level).toBe("Intermediate");
  });

  test("category filter narrows the delta", async () => {
    const category = encodeURIComponent(`D3 Alternate ${RUN_ID}`);
    const res = await listCoursesRoute(
      buildRequest(`${COURSES_API}?search=${RUN_ID}&category=${category}`, {
        cookie: admin.cookie,
      }),
    );
    const envelope = await parseEnvelope<Course[]>(res);
    expect(envelope.data.length).toBe(1);
    expect(envelope.data[0]?.id).toBe(ids.gammaId);

    const miss = await listCoursesRoute(
      buildRequest(`${COURSES_API}?search=${RUN_ID}&category=${encodeURIComponent("Nowhere")}`, {
        cookie: admin.cookie,
      }),
    );
    expect((await parseEnvelope<Course[]>(miss)).data.length).toBe(0);
  });

  test("pagination slices the delta", async () => {
    const res = await listCoursesRoute(
      buildRequest(`${COURSES_API}?search=${RUN_ID}&limit=2&page=1`, { cookie: admin.cookie }),
    );
    const envelope = await parseEnvelope<Course[]>(res);
    expect(envelope.data.length).toBe(2);
    expect(envelope.meta?.limit).toBe(2);
    expect(envelope.meta?.total).toBe(3);
    expect(envelope.meta?.totalPages).toBe(2);

    const pageTwo = await parseEnvelope<Course[]>(
      await listCoursesRoute(
        buildRequest(`${COURSES_API}?search=${RUN_ID}&limit=2&page=2`, { cookie: admin.cookie }),
      ),
    );
    expect(pageTwo.data.length).toBe(1);
  });
});
