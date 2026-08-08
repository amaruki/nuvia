/**
 * D3 — certificate listing, read, revoke: envelope/meta, filters,
 * pagination, and the revoke/restore PATCH lifecycle.
 */

import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { POST as createCourseRoute } from "@/app/api/v1/learning/courses/route";
import {
  GET as listCertificatesRoute,
  POST as issueCertificateRoute,
} from "@/app/api/v1/learning/certificates/route";
import {
  GET as getCertificateRoute,
  PATCH as updateCertificateRoute,
} from "@/app/api/v1/learning/certificates/[id]/route";
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
let staff: TestUser = { userId: "", email: "", cookie: "" };
let member: TestUser = { userId: "", email: "", cookie: "" };
let alphaId = "";

/** Certificate ids seeded by beforeAll, keyed as certAlphaId/certBetaId/… */
const certIds: Record<string, string> = {};

beforeAll(async () => {
  [admin, staff, member] = await Promise.all([
    signUpWithRole("lc-admin", "admin"),
    signUpWithRole("lc-staff", "staff"),
    signUpWithRole("lc-member", "member"),
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

  // Seed three certificates so list/pagination deltas have three rows.
  for (const suffix of ["alpha", "beta", "gamma"]) {
    const issueRes = await issueCertificateRoute(
      buildRequest(CERTS_API, {
        method: "POST",
        cookie: admin.cookie,
        body: certificatePayload(suffix, { courseId: alphaId }),
      }),
    );
    const envelope = await parseEnvelope<Certificate>(issueRes);
    trackCertificate(envelope.data.id);
    certIds[`cert${suffix[0].toUpperCase()}${suffix.slice(1)}Id`] = envelope.data.id;
  }
});

afterAll(cleanupAll);

describe("certificate listing and lifecycle", () => {
  test("list returns the RUN_ID delta with meta", async () => {
    const res = await listCertificatesRoute(
      buildRequest(`${CERTS_API}?search=${RUN_ID}&limit=100`, { cookie: admin.cookie }),
    );
    expect(res.status).toBe(200);

    const envelope = await parseEnvelope<Certificate[]>(res);
    expect(envelope.data.length).toBe(3);
    expect(envelope.meta?.total).toBe(3);
    expect(envelope.meta?.totalPages).toBe(1);
    for (const row of envelope.data) {
      expect(row.status).toBe("active");
    }
  });

  test("status and course filters narrow the delta", async () => {
    const active = await parseEnvelope<Certificate[]>(
      await listCertificatesRoute(
        buildRequest(`${CERTS_API}?search=${RUN_ID}&status=active`, { cookie: admin.cookie }),
      ),
    );
    expect(active.data.length).toBe(3);

    const revoked = await parseEnvelope<Certificate[]>(
      await listCertificatesRoute(
        buildRequest(`${CERTS_API}?search=${RUN_ID}&status=revoked`, { cookie: admin.cookie }),
      ),
    );
    expect(revoked.data.length).toBe(0);

    const byCourse = await parseEnvelope<Certificate[]>(
      await listCertificatesRoute(
        buildRequest(`${CERTS_API}?courseId=${alphaId}&limit=100`, { cookie: admin.cookie }),
      ),
    );
    expect(byCourse.data.length).toBeGreaterThanOrEqual(3);
    for (const row of byCourse.data) {
      expect(row.courseId).toBe(alphaId);
    }
  });

  test("pagination slices the delta", async () => {
    const res = await listCertificatesRoute(
      buildRequest(`${CERTS_API}?search=${RUN_ID}&limit=2&page=1`, { cookie: admin.cookie }),
    );
    const envelope = await parseEnvelope<Certificate[]>(res);
    expect(envelope.data.length).toBe(2);
    expect(envelope.meta?.total).toBe(3);
    expect(envelope.meta?.totalPages).toBe(2);
  });

  test("fetch one certificate; unknown id is a 404", async () => {
    const res = await getCertificateRoute(
      buildRequest(`${CERTS_API}/${certIds.certAlphaId}`, { cookie: staff.cookie }),
      ctx({ id: certIds.certAlphaId }),
    );
    expect(res.status).toBe(200);
    const envelope = await parseEnvelope<Certificate>(res);
    expect(envelope.data.id).toBe(certIds.certAlphaId);

    expect(
      (
        await getCertificateRoute(
          buildRequest(`${CERTS_API}/${MISSING_ID}`, { cookie: admin.cookie }),
          ctx({ id: MISSING_ID }),
        )
      ).status,
    ).toBe(404);
  });

  test("revoke requires learning:update and a valid status", async () => {
    expect(
      (
        await updateCertificateRoute(
          buildRequest(`${CERTS_API}/${certIds.certAlphaId}`, {
            method: "PATCH",
            cookie: member.cookie,
            body: { status: "revoked" },
          }),
          ctx({ id: certIds.certAlphaId }),
        )
      ).status,
    ).toBe(403);

    expect(
      (
        await updateCertificateRoute(
          buildRequest(`${CERTS_API}/${certIds.certAlphaId}`, {
            method: "PATCH",
            cookie: admin.cookie,
            body: { status: "expired" },
          }),
          ctx({ id: certIds.certAlphaId }),
        )
      ).status,
    ).toBe(422);

    expect(
      (
        await updateCertificateRoute(
          buildRequest(`${CERTS_API}/${MISSING_ID}`, {
            method: "PATCH",
            cookie: admin.cookie,
            body: { status: "revoked" },
          }),
          ctx({ id: MISSING_ID }),
        )
      ).status,
    ).toBe(404);
  });

  test("staff revokes a certificate and it shows as revoked", async () => {
    const res = await updateCertificateRoute(
      buildRequest(`${CERTS_API}/${certIds.certAlphaId}`, {
        method: "PATCH",
        cookie: staff.cookie,
        body: { status: "revoked" },
      }),
      ctx({ id: certIds.certAlphaId }),
    );
    expect(res.status).toBe(200);
    const envelope = await parseEnvelope<Certificate>(res);
    expect(envelope.data.status).toBe("revoked");

    // Restoring is the same PATCH with the other status.
    const restore = await updateCertificateRoute(
      buildRequest(`${CERTS_API}/${certIds.certAlphaId}`, {
        method: "PATCH",
        cookie: admin.cookie,
        body: { status: "active" },
      }),
      ctx({ id: certIds.certAlphaId }),
    );
    expect((await parseEnvelope<Certificate>(restore)).data.status).toBe("active");
  });
});
