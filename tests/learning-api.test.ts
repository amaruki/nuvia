/**
 * D3 — Learning API integration tests.
 *
 * Covers the learning courses + certificates surface end to end against the
 * shared test database (DATABASE_URL from .env):
 *
 * - authentication and per-action RBAC (admin full access, staff holds
 *   learning:read/update/manage but not create/delete, plain member holds
 *   none),
 * - payload validation (422), unknown-course issuance rejected (400),
 * - list filtering/search/pagination with the {data, meta} envelope for
 *   both resources,
 * - certificate issuance denormalizing course/instructor fields and the
 *   verification-code shape,
 * - revoke/restore via PATCH status,
 * - course deletion set-nulling certificate.courseId while the
 *   denormalized record survives,
 * - the service layer directly (round-trip, computeDuration, unknown ids).
 *
 * Every row this file creates is name-isolated by RUN_ID and removed in
 * afterAll, so the suite is self-cleaning and safe to run alongside other
 * test files. List assertions filter by search=RUN_ID so they measure
 * exactly what this run adds (baseline delta).
 */

import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { eq, inArray, like } from "drizzle-orm";
import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db/client";
import { certificate, course, user } from "@/db/schema";
import type { Certificate, Course } from "@/types/learning.types";
import { testIp } from "./helpers";

import {
  GET as listCoursesRoute,
  POST as createCourseRoute,
} from "@/app/api/v1/learning/courses/route";
import {
  DELETE as deleteCourseRoute,
  GET as getCourseRoute,
  PATCH as updateCourseRoute,
} from "@/app/api/v1/learning/courses/[id]/route";
import {
  GET as listCertificatesRoute,
  POST as issueCertificateRoute,
} from "@/app/api/v1/learning/certificates/route";
import {
  GET as getCertificateRoute,
  PATCH as updateCertificateRoute,
} from "@/app/api/v1/learning/certificates/[id]/route";
import {
  computeDuration,
  createCourse as createCourseDirect,
  deleteCourse as deleteCourseDirect,
  getCertificate as getCertificateDirect,
  getCourse as getCourseDirect,
  updateCourse as updateCourseDirect,
} from "@/lib/services/learning";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const RUN_ID = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const PASSWORD = "Sup3r-Secret-Passw0rd!";
const COURSES_API = "http://localhost:3000/api/v1/learning/courses";
const CERTS_API = "http://localhost:3000/api/v1/learning/certificates";

const MISSING_ID = "00000000-0000-4000-8000-000000000000";

const userIds: string[] = [];
const courseIds: string[] = [];
const certificateIds: string[] = [];

/** Values shared between ordered tests within this file. */
const state: Record<string, string> = {};

interface RequestOptions {
  method?: string;
  cookie?: string;
  body?: unknown;
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
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

async function parseEnvelope<T>(res: Response): Promise<{ data: T; meta?: PaginationMeta }> {
  return (await res.json()) as { data: T; meta?: PaginationMeta };
}

async function signUpWithRole(label: string, role: string | null) {
  const email = `d3-${label}-${RUN_ID}@example.test`;
  const username = `d3-${label}-${RUN_ID}`;

  const res = await auth.handler(
    new Request("http://localhost:3000/api/auth/sign-up/email", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": testIp() },
      body: JSON.stringify({ email, password: PASSWORD, name: `Learning D3 ${label}`, username }),
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

  return { userId: body.user.id, email, cookie };
}

function coursePayload(suffix: string, overrides: Record<string, unknown> = {}) {
  return {
    title: `d3-course-${suffix}-${RUN_ID}`,
    description: `A test course created by the D3 integration suite (${suffix}).`,
    longDescription: `Long description for the ${suffix} course used by the D3 suite.`,
    category: `D3 Category ${RUN_ID}`,
    level: "Beginner",
    price: 49,
    students: 12,
    rating: 4.5,
    color: "from-emerald-500 to-teal-600",
    instructor: {
      name: `D3 Instructor ${RUN_ID}`,
      role: "Principal Engineer",
      bio: "Teaches the D3 integration suite.",
    },
    modules: [
      {
        title: `D3 Module One ${RUN_ID}`,
        lessons: [
          { title: "Lesson 1", duration: "45m", type: "video" },
          { title: "Lesson 2", duration: "45 min", type: "article" },
        ],
      },
    ],
    features: ["Hands-on exercises", "Downloadable resources"],
    ...overrides,
  };
}

function certificatePayload(suffix: string, overrides: Record<string, unknown> = {}) {
  return {
    courseId: state.alphaId,
    studentName: `D3 Student ${suffix} ${RUN_ID}`,
    studentEmail: `d3-student-${suffix}-${RUN_ID}@example.test`,
    grade: "A",
    ...overrides,
  };
}

let admin = { userId: "", email: "", cookie: "" };
let staff = { userId: "", email: "", cookie: "" };
let member = { userId: "", email: "", cookie: "" };

beforeAll(async () => {
  [admin, staff, member] = await Promise.all([
    signUpWithRole("admin", "admin"),
    signUpWithRole("staff", "staff"),
    signUpWithRole("member", "member"),
  ]);
});

afterAll(async () => {
  // Certificates first (their courseId FK set-nulls on course delete), then
  // courses, then users. The name sweeps catch anything an
  // assertion-aborted test left behind.
  if (certificateIds.length > 0) {
    await db.delete(certificate).where(inArray(certificate.id, certificateIds));
  }
  await db.delete(certificate).where(like(certificate.courseName, `%${RUN_ID}%`));
  await db.delete(certificate).where(like(certificate.studentName, `%${RUN_ID}%`));
  if (courseIds.length > 0) {
    await db.delete(course).where(inArray(course.id, courseIds));
  }
  await db.delete(course).where(like(course.title, `%${RUN_ID}%`));
  if (userIds.length > 0) {
    await db.delete(user).where(inArray(user.id, userIds));
  }
});

// ---------------------------------------------------------------------------
// Authentication & RBAC
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Course creation
// ---------------------------------------------------------------------------

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
    courseIds.push(created.id);
    state.alphaId = created.id;

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

// ---------------------------------------------------------------------------
// Course listing: envelope, filters, search, pagination (baseline-delta)
// ---------------------------------------------------------------------------

describe("course listing", () => {
  beforeAll(async () => {
    // Seed two more courses with distinct level/category for filter assertions.
    for (const [suffix, overrides] of [
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
      courseIds.push(envelope.data.id);
      state[`${suffix}Id`] = envelope.data.id;
    }
  });

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
    expect(envelope.data[0]?.id).toBe(state.gammaId);

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

// ---------------------------------------------------------------------------
// Course read / update
// ---------------------------------------------------------------------------

describe("course read and update", () => {
  test("fetch one course by id", async () => {
    const res = await getCourseRoute(
      buildRequest(`${COURSES_API}/${state.alphaId}`, { cookie: staff.cookie }),
      ctx({ id: state.alphaId }),
    );
    expect(res.status).toBe(200);
    const envelope = await parseEnvelope<Course>(res);
    expect(envelope.data.id).toBe(state.alphaId);
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
          buildRequest(`${COURSES_API}/${state.alphaId}`, {
            method: "PATCH",
            cookie: member.cookie,
            body: { title: "nope" },
          }),
          ctx({ id: state.alphaId }),
        )
      ).status,
    ).toBe(403);

    expect(
      (
        await updateCourseRoute(
          buildRequest(`${COURSES_API}/${state.alphaId}`, {
            method: "PATCH",
            cookie: admin.cookie,
            body: {},
          }),
          ctx({ id: state.alphaId }),
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
      buildRequest(`${COURSES_API}/${state.alphaId}`, {
        method: "PATCH",
        cookie: staff.cookie,
        body: {
          title: `d3-course-alpha-renamed-${RUN_ID}`,
          level: "Advanced",
          students: 30,
          color: "from-rose-500 to-orange-500",
        },
      }),
      ctx({ id: state.alphaId }),
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

// ---------------------------------------------------------------------------
// Certificate issuance
// ---------------------------------------------------------------------------

describe("certificate issuance", () => {
  test("issue validates the payload", async () => {
    const missingCourse = await issueCertificateRoute(
      buildRequest(CERTS_API, {
        method: "POST",
        cookie: admin.cookie,
        body: certificatePayload("x", { courseId: undefined }),
      }),
    );
    expect(missingCourse.status).toBe(422);

    const badEmail = await issueCertificateRoute(
      buildRequest(CERTS_API, {
        method: "POST",
        cookie: admin.cookie,
        body: certificatePayload("x", { studentEmail: "not-an-email" }),
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
        body: certificatePayload("alpha"),
      }),
    );
    expect(res.status).toBe(201);

    const envelope = await parseEnvelope<Certificate>(res);
    const issued = envelope.data;
    certificateIds.push(issued.id);
    state.certAlphaId = issued.id;

    expect(issued.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(issued.courseId).toBe(state.alphaId);
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

// ---------------------------------------------------------------------------
// Certificate listing, read, revoke
// ---------------------------------------------------------------------------

describe("certificate listing and lifecycle", () => {
  beforeAll(async () => {
    // Seed two more certificates so list/pagination deltas have three rows.
    for (const suffix of ["beta", "gamma"]) {
      const res = await issueCertificateRoute(
        buildRequest(CERTS_API, {
          method: "POST",
          cookie: admin.cookie,
          body: certificatePayload(suffix),
        }),
      );
      const envelope = await parseEnvelope<Certificate>(res);
      certificateIds.push(envelope.data.id);
      state[`cert${suffix[0].toUpperCase()}${suffix.slice(1)}Id`] = envelope.data.id;
    }
  });

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
        buildRequest(`${CERTS_API}?courseId=${state.alphaId}&limit=100`, { cookie: admin.cookie }),
      ),
    );
    expect(byCourse.data.length).toBeGreaterThanOrEqual(3);
    for (const row of byCourse.data) {
      expect(row.courseId).toBe(state.alphaId);
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
      buildRequest(`${CERTS_API}/${state.certAlphaId}`, { cookie: staff.cookie }),
      ctx({ id: state.certAlphaId }),
    );
    expect(res.status).toBe(200);
    const envelope = await parseEnvelope<Certificate>(res);
    expect(envelope.data.id).toBe(state.certAlphaId);

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
          buildRequest(`${CERTS_API}/${state.certAlphaId}`, {
            method: "PATCH",
            cookie: member.cookie,
            body: { status: "revoked" },
          }),
          ctx({ id: state.certAlphaId }),
        )
      ).status,
    ).toBe(403);

    expect(
      (
        await updateCertificateRoute(
          buildRequest(`${CERTS_API}/${state.certAlphaId}`, {
            method: "PATCH",
            cookie: admin.cookie,
            body: { status: "expired" },
          }),
          ctx({ id: state.certAlphaId }),
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
      buildRequest(`${CERTS_API}/${state.certAlphaId}`, {
        method: "PATCH",
        cookie: staff.cookie,
        body: { status: "revoked" },
      }),
      ctx({ id: state.certAlphaId }),
    );
    expect(res.status).toBe(200);
    const envelope = await parseEnvelope<Certificate>(res);
    expect(envelope.data.status).toBe("revoked");

    // Restoring is the same PATCH with the other status.
    const restore = await updateCertificateRoute(
      buildRequest(`${CERTS_API}/${state.certAlphaId}`, {
        method: "PATCH",
        cookie: admin.cookie,
        body: { status: "active" },
      }),
      ctx({ id: state.certAlphaId }),
    );
    expect((await parseEnvelope<Certificate>(restore)).data.status).toBe("active");
  });
});

// ---------------------------------------------------------------------------
// Course deletion
// ---------------------------------------------------------------------------

describe("course deletion", () => {
  test("delete requires learning:delete", async () => {
    expect(
      (
        await deleteCourseRoute(
          buildRequest(`${COURSES_API}/${state.gammaId}`, {
            method: "DELETE",
            cookie: member.cookie,
          }),
          ctx({ id: state.gammaId }),
        )
      ).status,
    ).toBe(403);
    // staff holds read/update/manage but not delete
    expect(
      (
        await deleteCourseRoute(
          buildRequest(`${COURSES_API}/${state.gammaId}`, {
            method: "DELETE",
            cookie: staff.cookie,
          }),
          ctx({ id: state.gammaId }),
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
        body: certificatePayload("doomed", { courseId: state.gammaId }),
      }),
    );
    const issued = (await parseEnvelope<Certificate>(issueRes)).data;
    certificateIds.push(issued.id);
    state.certDoomedId = issued.id;
    expect(issued.courseName).toBe(`d3-course-gamma-${RUN_ID}`);

    const res = await deleteCourseRoute(
      buildRequest(`${COURSES_API}/${state.gammaId}`, { method: "DELETE", cookie: admin.cookie }),
      ctx({ id: state.gammaId }),
    );
    expect(res.status).toBe(200);
    const envelope = await parseEnvelope<{ id: string; deleted: boolean }>(res);
    expect(envelope.data).toEqual({ id: state.gammaId, deleted: true });

    const certFetch = await parseEnvelope<Certificate>(
      await getCertificateRoute(
        buildRequest(`${CERTS_API}/${state.certDoomedId}`, { cookie: admin.cookie }),
        ctx({ id: state.certDoomedId }),
      ),
    );
    expect(certFetch.data.courseId ?? null).toBeNull();
    expect(certFetch.data.courseName).toBe(`d3-course-gamma-${RUN_ID}`);

    expect(
      (
        await deleteCourseRoute(
          buildRequest(`${COURSES_API}/${state.gammaId}`, {
            method: "DELETE",
            cookie: admin.cookie,
          }),
          ctx({ id: state.gammaId }),
        )
      ).status,
    ).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// Service layer (direct)
// ---------------------------------------------------------------------------

describe("learning service layer", () => {
  test("computeDuration sums lesson durations", () => {
    expect(
      computeDuration([
        {
          id: "m1",
          title: "M",
          lessons: [
            { id: "l1", title: "a", duration: "1h", type: "video" },
            { id: "l2", title: "b", duration: "15m", type: "quiz" },
          ],
        },
      ]),
    ).toBe("1h 15m");
    expect(computeDuration([])).toBe("");
    expect(computeDuration(undefined)).toBe("");
  });

  test("course create/get/update/delete round-trip", async () => {
    const created = await createCourseDirect(
      {
        title: `d3-course-svc-${RUN_ID}`,
        description: "A service-layer course created by the D3 integration suite.",
        category: `D3 Category ${RUN_ID}`,
        level: "Intermediate",
      },
      "system:d3-test",
    );
    courseIds.push(created.id);

    expect(created.level).toBe("Intermediate");
    expect(created.students).toBe(0);
    expect(created.progress).toBe(0);
    // No modules provided → no derived duration.
    expect(created.duration).toBe("");

    const fetched = await getCourseDirect(created.id);
    expect(fetched?.title).toBe(created.title);

    const updated = await updateCourseDirect(created.id, { students: 5 }, "system:d3-test");
    expect(updated.students).toBe(5);

    expect(await deleteCourseDirect(created.id)).toBe(true);
    expect(await deleteCourseDirect(created.id)).toBe(false);
    expect(await getCourseDirect(created.id)).toBeNull();
  });

  test("unknown ids surface as null, not throws", async () => {
    expect(await getCourseDirect(MISSING_ID)).toBeNull();
    expect(await getCertificateDirect(MISSING_ID)).toBeNull();
  });
});
