/**
 * Shared fixtures for the B6 jobs API integration tests (see the sibling
 * *.test.ts files). Each call to createJobsApiFixtures() returns a fresh
 * RUN_ID-isolated context — reference rows, users, request builders — and a
 * teardown that removes everything the file created, so each part stays
 * self-cleaning and safe to run alongside the rest of the suite.
 */

import { eq, inArray } from "drizzle-orm";
import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db/client";
import {
  company,
  jobApplication,
  jobCategory,
  jobPosting,
  jobType,
  location,
  user,
} from "@/db/schema";
import { testIp } from "../helpers";

export interface JobsApiUser {
  userId: string;
  cookie: string;
}

export interface JobsApiUsers {
  admin: JobsApiUser;
  staff: JobsApiUser;
  member: JobsApiUser;
  applicant: JobsApiUser;
  applicant2: JobsApiUser;
}

interface RequestOptions {
  method?: string;
  cookie?: string;
  body?: unknown;
}

export function createJobsApiFixtures() {
  const RUN_ID = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const PASSWORD = "Sup3r-Secret-Passw0rd!";
  const API = "http://localhost:3000/api/v1/jobs";

  const refs = { categoryId: "", typeId: "", locationId: "", companyId: "" };
  const userIds: string[] = [];
  const postingIds: string[] = [];

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

  async function parseEnvelope(res: Response) {
    return (await res.json()) as { data: any; meta?: any };
  }

  async function signUpWithRole(label: string, role: string | null): Promise<JobsApiUser> {
    const email = `jobs-b6-${label}-${RUN_ID}@example.test`;
    const username = `jobs-b6-${label}-${RUN_ID}`;

    const res = await auth.handler(
      new Request("http://localhost:3000/api/auth/sign-up/email", {
        method: "POST",
        headers: { "content-type": "application/json", "x-forwarded-for": testIp() },
        body: JSON.stringify({ email, password: PASSWORD, name: `Jobs B6 ${label}`, username }),
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

    return { userId: body.user.id, cookie };
  }

  function postingPayload(overrides: Record<string, unknown> = {}) {
    return {
      title: `B6 Test Posting ${RUN_ID}`,
      description: "A test job description that is long enough to pass validation.",
      requirements: "Must enjoy writing tests.",
      categoryId: refs.categoryId,
      typeId: refs.typeId,
      locationId: refs.locationId,
      companyId: refs.companyId,
      employmentType: "FULL_TIME",
      experienceLevel: "MID_LEVEL",
      salaryMin: 60000,
      salaryMax: 80000,
      currency: "USD",
      tags: ["b6-test"],
      ...overrides,
    };
  }

  async function setup(): Promise<JobsApiUsers> {
    const [categoryRow] = await db
      .insert(jobCategory)
      .values({ name: `jobs-b6-cat-${RUN_ID}`, displayName: `B6 Test Category ${RUN_ID}` })
      .returning();
    const [typeRow] = await db
      .insert(jobType)
      .values({ name: `jobs-b6-type-${RUN_ID}`, displayName: `B6 Test Type ${RUN_ID}` })
      .returning();
    const [locationRow] = await db
      .insert(location)
      .values({ name: `jobs-b6-loc-${RUN_ID}`, displayName: `B6 Testville ${RUN_ID}` })
      .returning();
    const [companyRow] = await db
      .insert(company)
      .values({ name: `jobs-b6-co-${RUN_ID}`, displayName: `B6 Test Corp ${RUN_ID}` })
      .returning();

    refs.categoryId = categoryRow!.id;
    refs.typeId = typeRow!.id;
    refs.locationId = locationRow!.id;
    refs.companyId = companyRow!.id;

    const [admin, staff, member, applicant, applicant2] = await Promise.all([
      signUpWithRole("admin", "admin"),
      signUpWithRole("staff", "staff"),
      signUpWithRole("member", "member"),
      signUpWithRole("applicant", null),
      signUpWithRole("applicant2", null),
    ]);
    return { admin, staff, member, applicant, applicant2 };
  }

  async function teardown(): Promise<void> {
    // Order matters: applications reference postings, postings reference the
    // reference tables, and the users we created posted/applied to them.
    if (postingIds.length > 0) {
      await db.delete(jobApplication).where(inArray(jobApplication.jobId, postingIds));
      await db.delete(jobPosting).where(inArray(jobPosting.id, postingIds));
    }
    await db.delete(jobCategory).where(eq(jobCategory.id, refs.categoryId));
    await db.delete(jobType).where(eq(jobType.id, refs.typeId));
    await db.delete(location).where(eq(location.id, refs.locationId));
    await db.delete(company).where(eq(company.id, refs.companyId));
    if (userIds.length > 0) {
      await db.delete(user).where(inArray(user.id, userIds));
    }
  }

  return {
    RUN_ID,
    API,
    refs,
    postingIds,
    buildRequest,
    ctx,
    parseEnvelope,
    postingPayload,
    setup,
    teardown,
  };
}
