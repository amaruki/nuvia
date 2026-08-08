/**
 * D3 — learning authentication and RBAC.
 *
 * Plain members hold no learning:* permissions at all and anonymous requests
 * get no further than the auth gate; staff holds read/update/manage but not
 * create/delete.
 */

import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import {
  GET as listCoursesRoute,
  POST as createCourseRoute,
} from "@/app/api/v1/learning/courses/route";
import { GET as getCourseRoute } from "@/app/api/v1/learning/courses/[id]/route";
import {
  GET as listCertificatesRoute,
  POST as issueCertificateRoute,
} from "@/app/api/v1/learning/certificates/route";
import { GET as getCertificateRoute } from "@/app/api/v1/learning/certificates/[id]/route";
import {
  buildRequest,
  CERTS_API,
  cleanupAll,
  COURSES_API,
  coursePayload,
  certificatePayload,
  ctx,
  MISSING_ID,
  signUpWithRole,
  type TestUser,
} from "./helpers";

let staff: TestUser = { userId: "", email: "", cookie: "" };
let member: TestUser = { userId: "", email: "", cookie: "" };

beforeAll(async () => {
  [staff, member] = await Promise.all([
    signUpWithRole("rbac-staff", "staff"),
    signUpWithRole("rbac-member", "member"),
  ]);
});

afterAll(cleanupAll);

describe("learning authentication and RBAC", () => {
  test("course listing and creation require authentication and learning permissions", async () => {
    expect((await listCoursesRoute(buildRequest(COURSES_API))).status).toBe(401);
    // Plain member holds no learning:* permissions at all.
    expect(
      (await listCoursesRoute(buildRequest(COURSES_API, { cookie: member.cookie }))).status,
    ).toBe(403);

    expect(
      (
        await createCourseRoute(
          buildRequest(COURSES_API, { method: "POST", body: coursePayload("anon") }),
        )
      ).status,
    ).toBe(401);
    expect(
      (
        await createCourseRoute(
          buildRequest(COURSES_API, {
            method: "POST",
            cookie: member.cookie,
            body: coursePayload("m"),
          }),
        )
      ).status,
    ).toBe(403);
    // staff holds learning:read/update/manage but not learning:create
    expect(
      (
        await createCourseRoute(
          buildRequest(COURSES_API, {
            method: "POST",
            cookie: staff.cookie,
            body: coursePayload("s"),
          }),
        )
      ).status,
    ).toBe(403);
  });

  test("item reads require learning:read", async () => {
    expect(
      (await getCourseRoute(buildRequest(`${COURSES_API}/${MISSING_ID}`), ctx({ id: MISSING_ID })))
        .status,
    ).toBe(401);
    expect(
      (
        await getCourseRoute(
          buildRequest(`${COURSES_API}/${MISSING_ID}`, { cookie: member.cookie }),
          ctx({ id: MISSING_ID }),
        )
      ).status,
    ).toBe(403);
    expect(
      (
        await getCertificateRoute(
          buildRequest(`${CERTS_API}/${MISSING_ID}`),
          ctx({ id: MISSING_ID }),
        )
      ).status,
    ).toBe(401);
    expect(
      (
        await getCertificateRoute(
          buildRequest(`${CERTS_API}/${MISSING_ID}`, { cookie: member.cookie }),
          ctx({ id: MISSING_ID }),
        )
      ).status,
    ).toBe(403);
  });

  test("certificate listing and issuance are permission-gated too", async () => {
    expect((await listCertificatesRoute(buildRequest(CERTS_API))).status).toBe(401);
    expect(
      (await listCertificatesRoute(buildRequest(CERTS_API, { cookie: member.cookie }))).status,
    ).toBe(403);
    expect(
      (
        await issueCertificateRoute(
          buildRequest(CERTS_API, {
            method: "POST",
            cookie: staff.cookie,
            body: certificatePayload("s"),
          }),
        )
      ).status,
    ).toBe(403);
  });
});
