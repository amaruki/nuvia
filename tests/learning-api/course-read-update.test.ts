/**
 * D3 — course read and update: item fetch, 404s, permission and validation
 * gates, and partial-update reflection.
 */

import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { POST as createCourseRoute } from "@/app/api/v1/learning/courses/route";
import {
  GET as getCourseRoute,
  PATCH as updateCourseRoute,
} from "@/app/api/v1/learning/courses/[id]/route";
import type { Course } from "@/types/learning.types";
import {
  buildRequest,
  cleanupAll,
  COURSES_API,
  coursePayload,
  ctx,
  MISSING_ID,
  parseEnvelope,
  RUN_ID,
  signUpWithRole,
  trackCourse,
  type TestUser,
} from "./helpers";

let admin: TestUser = { userId: "", email: "", cookie: "" };
let staff: TestUser = { userId: "", email: "", cookie: "" };
let member: TestUser = { userId: "", email: "", cookie: "" };
let alphaId = "";

beforeAll(async () => {
  [admin, staff, member] = await Promise.all([
    signUpWithRole("ru-admin", "admin"),
    signUpWithRole("ru-staff", "staff"),
    signUpWithRole("ru-member", "member"),
  ]);

  const res = await createCourseRoute(
    buildRequest(COURSES_API, {
      method: "POST",
      cookie: admin.cookie,
      body: coursePayload("alpha"),
    }),
  );
  alphaId = (await parseEnvelope<Course>(res)).data.id;
  trackCourse(alphaId);
});

afterAll(cleanupAll);

describe("course read and update", () => {
  test("fetch one course by id", async () => {
    const res = await getCourseRoute(
      buildRequest(`${COURSES_API}/${alphaId}`, { cookie: staff.cookie }),
      ctx({ id: alphaId }),
    );
    expect(res.status).toBe(200);
    const envelope = await parseEnvelope<Course>(res);
    expect(envelope.data.id).toBe(alphaId);
    expect(envelope.data.modules).toHaveLength(1);
  });

  test("unknown id is a 404", async () => {
    expect(
      (
        await getCourseRoute(
          buildRequest(`${COURSES_API}/${MISSING_ID}`, { cookie: admin.cookie }),
          ctx({ id: MISSING_ID }),
        )
      ).status,
    ).toBe(404);
  });

  test("update requires learning:update and a non-empty body", async () => {
    expect(
      (
        await updateCourseRoute(
          buildRequest(`${COURSES_API}/${alphaId}`, {
            method: "PATCH",
            cookie: member.cookie,
            body: { title: "nope" },
          }),
          ctx({ id: alphaId }),
        )
      ).status,
    ).toBe(403);

    expect(
      (
        await updateCourseRoute(
          buildRequest(`${COURSES_API}/${alphaId}`, {
            method: "PATCH",
            cookie: admin.cookie,
            body: {},
          }),
          ctx({ id: alphaId }),
        )
      ).status,
    ).toBe(422);

    expect(
      (
        await updateCourseRoute(
          buildRequest(`${COURSES_API}/${MISSING_ID}`, {
            method: "PATCH",
            cookie: admin.cookie,
            body: { title: "ghost" },
          }),
          ctx({ id: MISSING_ID }),
        )
      ).status,
    ).toBe(404);
  });

  test("staff updates fields and the response reflects them", async () => {
    const res = await updateCourseRoute(
      buildRequest(`${COURSES_API}/${alphaId}`, {
        method: "PATCH",
        cookie: staff.cookie,
        body: {
          title: `d3-course-alpha-renamed-${RUN_ID}`,
          level: "Advanced",
          students: 30,
          color: "from-rose-500 to-orange-500",
        },
      }),
      ctx({ id: alphaId }),
    );
    expect(res.status).toBe(200);
    const envelope = await parseEnvelope<Course>(res);
    expect(envelope.data.title).toBe(`d3-course-alpha-renamed-${RUN_ID}`);
    expect(envelope.data.level).toBe("Advanced");
    expect(envelope.data.students).toBe(30);
    expect(envelope.data.color).toBe("from-rose-500 to-orange-500");
    // Untouched metadata survives a partial update.
    expect(envelope.data.modules).toHaveLength(1);
  });
});
