/**
 * D3 — certificate issuance: validation, unknown-course rejection, and the
 * denormalized course data captured at issue time.
 */

import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { POST as createCourseRoute } from "@/app/api/v1/learning/courses/route";
import { PATCH as updateCourseRoute } from "@/app/api/v1/learning/courses/[id]/route";
import { POST as issueCertificateRoute } from "@/app/api/v1/learning/certificates/route";
import type { Certificate, Course } from "@/types/learning.types";
import {
  buildRequest,
  certificatePayload,
  cleanupAll,
  COURSES_API,
  CERTS_API,
  coursePayload,
  ctx,
  MISSING_ID,
  parseEnvelope,
  RUN_ID,
  signUpWithRole,
  trackCertificate,
  trackCourse,
  type TestUser,
} from "./helpers";

let admin: TestUser = { userId: "", email: "", cookie: "" };
let alphaId = "";

beforeAll(async () => {
  admin = await signUpWithRole("ci-admin", "admin");

  const res = await createCourseRoute(
    buildRequest(COURSES_API, {
      method: "POST",
      cookie: admin.cookie,
      body: coursePayload("alpha"),
    }),
  );
  alphaId = (await parseEnvelope<Course>(res)).data.id;
  trackCourse(alphaId);

  // The issuance assertions read the denormalized post-rename title, and the
  // original suite renamed the course before issuing, so do the same here.
  await updateCourseRoute(
    buildRequest(`${COURSES_API}/${alphaId}`, {
      method: "PATCH",
      cookie: admin.cookie,
      body: { title: `d3-course-alpha-renamed-${RUN_ID}` },
    }),
    ctx({ id: alphaId }),
  );
});

afterAll(cleanupAll);

describe("certificate issuance", () => {
  test("issue validates the payload", async () => {
    const missingCourse = await issueCertificateRoute(
      buildRequest(CERTS_API, {
        method: "POST",
        cookie: admin.cookie,
        body: certificatePayload("x"),
      }),
    );
    expect(missingCourse.status).toBe(422);

    const badEmail = await issueCertificateRoute(
      buildRequest(CERTS_API, {
        method: "POST",
        cookie: admin.cookie,
        body: certificatePayload("x", { courseId: alphaId, studentEmail: "not-an-email" }),
      }),
    );
    expect(badEmail.status).toBe(422);
  });

  test("issuing for an unknown course is a business logic error", async () => {
    const res = await issueCertificateRoute(
      buildRequest(CERTS_API, {
        method: "POST",
        cookie: admin.cookie,
        body: certificatePayload("ghost", { courseId: MISSING_ID }),
      }),
    );
    expect(res.status).toBe(400);
    const body = (await res.json()) as { data?: unknown };
    expect(body.data).toBeUndefined();
  });

  test("admin issues a certificate with denormalized course data", async () => {
    const res = await issueCertificateRoute(
      buildRequest(CERTS_API, {
        method: "POST",
        cookie: admin.cookie,
        body: certificatePayload("alpha", { courseId: alphaId }),
      }),
    );
    expect(res.status).toBe(201);

    const envelope = await parseEnvelope<Certificate>(res);
    const issued = envelope.data;
    trackCertificate(issued.id);

    expect(issued.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(issued.courseId).toBe(alphaId);
    // Course title denormalized at issue time (post-rename title).
    expect(issued.courseName).toBe(`d3-course-alpha-renamed-${RUN_ID}`);
    expect(issued.studentName).toBe(`D3 Student alpha ${RUN_ID}`);
    expect(issued.studentEmail).toBe(`d3-student-alpha-${RUN_ID}@example.test`);
    expect(issued.instructorName).toBe(`D3 Instructor ${RUN_ID}`);
    expect(issued.status).toBe("active");
    expect(issued.grade).toBe("A");
    expect(issued.verificationCode).toMatch(/^[A-Z]{1,4}(-[A-Z]{1,4})?-\d{4}-\d{4}$/);
    expect(typeof issued.issueDate).toBe("string");
  });
});
