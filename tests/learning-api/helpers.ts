/**
 * D3 — shared fixtures for the Learning API integration tests.
 *
 * The suite covers the learning courses + certificates surface end to end
 * against the shared test database (DATABASE_URL from .env): per-action
 * RBAC, payload validation, list filtering/search/pagination with the
 * {data, meta} envelope, certificate issuance with denormalized course
 * data, revoke/restore, course deletion set-nulling certificate.courseId,
 * and the service layer directly.
 *
 * Every test file in this folder is self-contained: it signs up the roles
 * it needs, seeds its own rows, and removes everything it created in
 * afterAll. Rows are name-isolated by RUN_ID, so the suite is
 * baseline-delta and safe to run alongside other test files — list
 * assertions filter by search=RUN_ID and measure exactly what this run
 * adds.
 */

import { eq, inArray, like } from "drizzle-orm";
import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db/client";
import { certificate, course, user } from "@/db/schema";
import { testIp } from "../helpers";

export const RUN_ID = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
export const PASSWORD = "Sup3r-Secret-Passw0rd!";
export const COURSES_API = "http://localhost:3000/api/v1/learning/courses";
export const CERTS_API = "http://localhost:3000/api/v1/learning/certificates";

export const MISSING_ID = "00000000-0000-4000-8000-000000000000";

const userIds: string[] = [];
const courseIds: string[] = [];
const certificateIds: string[] = [];

export interface RequestOptions {
  method?: string;
  cookie?: string;
  body?: unknown;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface TestUser {
  userId: string;
  email: string;
  cookie: string;
}

export function buildRequest(url: string, options: RequestOptions = {}): NextRequest {
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

export function ctx<T extends Record<string, string>>(params: T): { params: Promise<T> } {
  return { params: Promise.resolve(params) };
}

export async function parseEnvelope<T>(res: Response): Promise<{ data: T; meta?: PaginationMeta }> {
  return (await res.json()) as { data: T; meta?: PaginationMeta };
}

export async function signUpWithRole(label: string, role: string | null): Promise<TestUser> {
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

export function coursePayload(suffix: string, overrides: Record<string, unknown> = {}) {
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

/** Callers pass courseId explicitly through overrides. */
export function certificatePayload(suffix: string, overrides: Record<string, unknown> = {}) {
  return {
    studentName: `D3 Student ${suffix} ${RUN_ID}`,
    studentEmail: `d3-student-${suffix}-${RUN_ID}@example.test`,
    grade: "A",
    ...overrides,
  };
}

export function trackCourse(id: string): void {
  courseIds.push(id);
}

export function trackCertificate(id: string): void {
  certificateIds.push(id);
}

/**
 * Remove everything this run created. Certificates go first (their courseId
 * FK set-nulls on course delete), then courses, then users. The name sweeps
 * catch anything an assertion-aborted test left behind.
 */
export async function cleanupAll(): Promise<void> {
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
}
