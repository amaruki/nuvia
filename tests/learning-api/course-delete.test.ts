/**
 * D3 — course deletion: permission gate and the set-null of
 * certificate.courseId while the denormalized certificate survives.
 */

import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { POST as createCourseRoute } from "@/app/api/v1/learning/courses/route";
import { DELETE as deleteCourseRoute } from "@/app/api/v1/learning/courses/[id]/route";
import { POST as issueCertificateRoute } from "@/app/api/v1/learning/certificates/route";
import { GET as getCertificateRoute } from "@/app/api/v1/learning/certificates/[id]/route";
import type { Certificate, Course } from "@/types/learning.types";
import {
  buildRequest,
  certificatePayload,
  cleanupAll,
  COURSES_API,
  CERTS_API,
  coursePayload,
  ctx,
  parseEnvelope,
  RUN_ID,
  signUpWithRole,
  trackCertificate,
  trackCourse,
  type TestUser,
} from "./helpers";

let admin: TestUser = { userId: "", email: "", cookie: "" };
let staff: TestUser = { userId: "", email: "", cookie: "" };
let member: TestUser = { userId: "", email: "", cookie: "" };
let gammaId = "";

beforeAll(async () => {
  [admin, staff, member] = await Promise.all([
    signUpWithRole("cd-admin", "admin"),
    signUpWithRole("cd-staff", "staff"),
    signUpWithRole("cd-member", "member"),
  ]);

  const res = await createCourseRoute(
    buildRequest(COURSES_API, {
      method: "POST",
      cookie: admin.cookie,
      body: coursePayload("gamma", { category: `D3 Alternate ${RUN_ID}` }),
    }),
  );
  gammaId = (await parseEnvelope<Course>(res)).data.id;
  trackCourse(gammaId);
});

afterAll(cleanupAll);

describe("course deletion", () => {
  test("delete requires learning:delete", async () => {
    expect(
      (
        await deleteCourseRoute(
          buildRequest(`${COURSES_API}/${gammaId}`, {
            method: "DELETE",
            cookie: member.cookie,
          }),
          ctx({ id: gammaId }),
        )
      ).status,
    ).toBe(403);
    // staff holds read/update/manage but not delete
    expect(
      (
        await deleteCourseRoute(
          buildRequest(`${COURSES_API}/${gammaId}`, {
            method: "DELETE",
            cookie: staff.cookie,
          }),
          ctx({ id: gammaId }),
        )
      ).status,
    ).toBe(403);
  });

  test("deleting a course set-nulls certificate.courseId but keeps the record", async () => {
    // Issue a certificate against the course we are about to delete.
    const issueRes = await issueCertificateRoute(
      buildRequest(CERTS_API, {
        method: "POST",
        cookie: admin.cookie,
        body: certificatePayload("doomed", { courseId: gammaId }),
      }),
    );
    const issued = (await parseEnvelope<Certificate>(issueRes)).data;
    trackCertificate(issued.id);
    const certDoomedId = issued.id;
    expect(issued.courseName).toBe(`d3-course-gamma-${RUN_ID}`);

    const res = await deleteCourseRoute(
      buildRequest(`${COURSES_API}/${gammaId}`, { method: "DELETE", cookie: admin.cookie }),
      ctx({ id: gammaId }),
    );
    expect(res.status).toBe(200);
    const envelope = await parseEnvelope<{ id: string; deleted: boolean }>(res);
    expect(envelope.data).toEqual({ id: gammaId, deleted: true });

    const certFetch = await parseEnvelope<Certificate>(
      await getCertificateRoute(
        buildRequest(`${CERTS_API}/${certDoomedId}`, { cookie: admin.cookie }),
        ctx({ id: certDoomedId }),
      ),
    );
    expect(certFetch.data.courseId ?? null).toBeNull();
    expect(certFetch.data.courseName).toBe(`d3-course-gamma-${RUN_ID}`);

    expect(
      (
        await deleteCourseRoute(
          buildRequest(`${COURSES_API}/${gammaId}`, {
            method: "DELETE",
            cookie: admin.cookie,
          }),
          ctx({ id: gammaId }),
        )
      ).status,
    ).toBe(404);
  });
});
