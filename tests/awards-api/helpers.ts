/**
 * Shared fixtures for the awards API integration suites (backlog D4).
 *
 * Isolation: every fixture name/email embeds a per-file RUN_ID (newRunId);
 * list assertions use the baseline-delta technique (search=RUN_ID) so the
 * shared test database can hold rows from other runs. Each file sweeps its
 * own rows in afterAll, so an aborted suite still self-cleans on the next
 * run's delete path.
 */

import { eq, inArray, like } from "drizzle-orm";
import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db/client";
import { awardNomination, awardProgram, user } from "@/db/schema";
import { testIp } from "../helpers";

export const PASSWORD = "Sup3r-Secret-Passw0rd!";
export const PROGRAMS_API = "http://localhost:3000/api/v1/awards/programs";
export const NOMINATIONS_API = "http://localhost:3000/api/v1/awards/nominations";

export interface RequestOptions {
  method?: string;
  cookie?: string;
  body?: unknown;
}

export interface ListMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ValidationIssue {
  field: string;
  message: string;
}

export interface WireProgram {
  id: string;
  name: string;
  description: string;
  category: string;
  status: string;
  criteria: string[];
  openDate: string | null;
  closeDate: string | null;
  awardDate: string | null;
  nominationCount: number;
  createdBy: string;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WireNomination {
  id: string;
  programId: string;
  programName: string;
  userId: string | null;
  nomineeName: string;
  nomineeEmail: string;
  nominatorName: string;
  nominatorEmail: string;
  status: string;
  statement: string;
  createdBy: string;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TestUser {
  userId: string;
  email: string;
  cookie: string;
}

/** Per-file isolation key, embedded in every fixture name and email. */
export function newRunId(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
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

/**
 * Test-only boundary: envelope shapes are asserted field-by-field by the
 * expectations, so one typed read per response keeps assertions honest
 * without re-declaring the wire shape at every call site.
 */
export async function parseJson<T>(res: Response): Promise<T> {
  return (await res.json()) as T;
}

export async function signUpWithRole(
  runId: string,
  label: string,
  role: string | null,
  userIds: string[],
): Promise<TestUser> {
  const email = `d4-${label}-${runId}@example.test`;
  const username = `d4-${label}-${runId}`;

  const res = await auth.handler(
    new Request("http://localhost:3000/api/auth/sign-up/email", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": testIp() },
      body: JSON.stringify({ email, password: PASSWORD, name: `Awards D4 ${label}`, username }),
    }),
  );
  const body = await parseJson<{ user?: { id: string } }>(res);
  if (!res.ok || !body.user) {
    throw new Error(`sign-up failed for ${label}: ${res.status}`);
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

export function programPayload(
  runId: string,
  suffix: string,
  overrides: Record<string, unknown> = {},
) {
  return {
    name: `d4-program-${suffix}-${runId}`,
    description: `Test award program ${suffix} created by the D4 integration suite (${runId}).`,
    status: "open",
    category: "achievement",
    criteria: ["Open to all members", "Work must be published in the last 12 months"],
    openDate: "2026-01-01T00:00:00.000Z",
    closeDate: "2026-06-30T23:59:59.000Z",
    awardDate: "2026-09-15T00:00:00.000Z",
    ...overrides,
  };
}

export function nominationPayload(
  runId: string,
  programId: string,
  suffix: string,
  overrides: Record<string, unknown> = {},
) {
  return {
    programId,
    nomineeName: `d4-nominee-${suffix}-${runId}`,
    nomineeEmail: `d4-nominee-${suffix}-${runId}@example.test`,
    nominatorName: `d4-nominator-${suffix}-${runId}`,
    nominatorEmail: `d4-nominator-${suffix}-${runId}@example.test`,
    statement: `Supporting statement for nomination ${suffix} (${runId}).`,
    ...overrides,
  };
}

/**
 * Programs cascade their nominations; users go last. The name sweeps catch
 * anything an assertion-aborted test left behind.
 */
export async function sweepFixtures(
  runId: string,
  programIds: string[],
  userIds: string[],
): Promise<void> {
  if (programIds.length > 0) {
    await db.delete(awardProgram).where(inArray(awardProgram.id, programIds));
  }
  await db.delete(awardNomination).where(like(awardNomination.nomineeName, `%${runId}%`));
  await db.delete(awardProgram).where(like(awardProgram.name, `%${runId}%`));
  if (userIds.length > 0) {
    await db.delete(user).where(inArray(user.id, userIds));
  }
}
