/**
 * D1 — Chapters API integration suite: shared fixtures.
 *
 * The suite covers the chapters CRUD surface end to end against the shared
 * test database (DATABASE_URL from .env): authentication and per-action
 * RBAC, payload validation, duplicate-name conflicts, list filtering/search/
 * pagination with the {data, meta} envelope, parent/child hierarchy, delete
 * cascading, and the service layer directly. Each concern lives in its own
 * *.test.ts file in this folder.
 *
 * createFixtures() gives every test file its own RUN_ID and cleanup
 * registry: bun runs all files in one process, so a module-level RUN_ID
 * would collide across files on the unique chapter names and sign-up
 * usernames. Every row a file creates is name-isolated by its RUN_ID and
 * removed by cleanup(), so each file stays self-cleaning and safe to run
 * alongside other test files.
 */

import { eq, inArray, like } from "drizzle-orm";
import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db/client";
import { chapter, user } from "@/db/schema";
import { testIp } from "../helpers";

export const PASSWORD = "Sup3r-Secret-Passw0rd!";
export const API = "http://localhost:3000/api/v1/chapters";

export interface RequestOptions {
  method?: string;
  cookie?: string;
  body?: unknown;
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

export async function parseEnvelope(res: Response) {
  return (await res.json()) as { data: any; meta?: any };
}

export function createFixtures() {
  const RUN_ID = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

  const userIds: string[] = [];
  const chapterIds: string[] = [];

  async function signUpWithRole(label: string, role: string | null) {
    const email = `d1-${label}-${RUN_ID}@example.test`;
    const username = `d1-${label}-${RUN_ID}`;

    const res = await auth.handler(
      new Request("http://localhost:3000/api/auth/sign-up/email", {
        method: "POST",
        headers: { "content-type": "application/json", "x-forwarded-for": testIp() },
        body: JSON.stringify({ email, password: PASSWORD, name: `Chapters D1 ${label}`, username }),
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

  function chapterPayload(suffix: string, overrides: Record<string, unknown> = {}) {
    return {
      name: `d1-chapter-${suffix}-${RUN_ID}`,
      displayName: `D1 ${suffix} Chapter ${RUN_ID}`,
      description: "A test chapter created by the D1 integration suite.",
      status: "active",
      location: {
        address: "1 Test Way",
        city: "Testville",
        state: "Testland",
        country: "Testonia",
        postalCode: "12345",
        coordinates: { latitude: 12.5, longitude: -45.25 },
        timezone: "UTC",
        region: `D1 Region ${RUN_ID}`,
      },
      contactInfo: {
        email: `chapter-${suffix}-${RUN_ID}@example.test`,
        phone: "+1 555 0100",
        website: "https://chapters.example.test",
        address: "1 Test Way, Testville",
      },
      socialMedia: { twitter: "" },
      settings: {
        allowOnlineRegistration: true,
        requireApproval: false,
        membershipDues: 25,
        meetingFrequency: "monthly",
        autoRenewMembership: false,
        sendReminders: true,
        publicDirectory: true,
      },
      ...overrides,
    };
  }

  async function cleanup() {
    // Chapters cascade their member rows; users go last. The name sweep
    // catches anything an assertion-aborted test left behind.
    if (chapterIds.length > 0) {
      await db.delete(chapter).where(inArray(chapter.id, chapterIds));
    }
    await db.delete(chapter).where(like(chapter.name, `%${RUN_ID}%`));
    if (userIds.length > 0) {
      await db.delete(user).where(inArray(user.id, userIds));
    }
  }

  return { RUN_ID, userIds, chapterIds, signUpWithRole, chapterPayload, cleanup };
}
