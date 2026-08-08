/**
 * D3 — course creation: payload validation and the created envelope shape.
 */

import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { POST as createCourseRoute } from "@/app/api/v1/learning/courses/route";
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

beforeAll(async () => {
  admin = await signUpWithRole("cw-admin", "admin");
});

afterAll(cleanupAll);

describe("course creation", () => {
  test("create validates the payload", async () => {
    const empty = await createCourseRoute(
      buildRequest(COURSES_API, { method: "POST", cookie: admin.cookie, body: {} }),
    );
    expect(empty.status).toBe(422);

    const badLevel = await createCourseRoute(
      buildRequest(COURSES_API, {
        method: "POST",
        cookie: admin.cookie,
        body: coursePayload("bad", { level: "Expert" }),
      }),
    );
    expect(badLevel.status).toBe(422);

    const shortTitle = await createCourseRoute(
      buildRequest(COURSES_API, {
        method: "POST",
        cookie: admin.cookie,
        body: coursePayload("short", { title: "x" }),
      }),
    );
    expect(shortTitle.status).toBe(422);
  });

  test("admin creates a course and the envelope carries the full UI shape", async () => {
    const res = await createCourseRoute(
      buildRequest(COURSES_API, {
        method: "POST",
        cookie: admin.cookie,
        body: coursePayload("alpha"),
      }),
    );
    expect(res.status).toBe(201);

    const envelope = await parseEnvelope<Course>(res);
    const created = envelope.data;
    trackCourse(created.id);

    expect(created.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(created.title).toBe(`d3-course-alpha-${RUN_ID}`);
    expect(created.category).toBe(`D3 Category ${RUN_ID}`);
    expect(created.level).toBe("Beginner");
    // Duration derived from the module lessons (45m + 45min).
    expect(created.duration).toBe("1h 30m");
    expect(created.students).toBe(12);
    expect(created.rating).toBe(4.5);
    expect(created.price).toBe(49);
    // Progress stays a neutral 0 until enrollment tracking exists.
    expect(created.progress).toBe(0);
    expect(created.color).toBe("from-emerald-500 to-teal-600");
    expect(created.modules).toHaveLength(1);
    expect(created.modules?.[0]?.lessons).toHaveLength(2);
    expect(created.features).toEqual(["Hands-on exercises", "Downloadable resources"]);
    expect(created.instructor?.name).toBe(`D3 Instructor ${RUN_ID}`);
    expect(typeof created.updatedAt).toBe("string");
  });
});
