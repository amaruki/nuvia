/**
 * Shared fixtures for the D2 committees API integration tests.
 *
 * Each *.test.ts file in this folder is self-contained: it creates its own
 * registry (RUN_ID + row tracking), signs up its own actors, and removes
 * every row it created in afterAll through cleanupCommitteesRun. That keeps
 * the baseline-delta contract per file, so the files can run in any order
 * and alongside other test files.
 */

import { eq, inArray } from "drizzle-orm";
import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db/client";
import { committee, committeeMember, user } from "@/db/schema";
import { testIp } from "../helpers";

import { POST as createCommittee } from "@/app/api/v1/committees/route";

export const PASSWORD = "Sup3r-Secret-Passw0rd!";
export const API = "http://localhost:3000/api/v1/committees";

export interface Actor {
  userId: string;
  cookie: string;
}

export interface Actors {
  admin: Actor;
  staff: Actor;
  member: Actor;
}

/** Tracks every row a test file creates so afterAll can remove it. */
export interface RunRegistry {
  runId: string;
  userIds: string[];
  committeeIds: string[];
  /** Bumped per payload so every created committee has a unique name. */
  payloadSeq: number;
}

export function createRegistry(): RunRegistry {
  return {
    runId: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    userIds: [],
    committeeIds: [],
    payloadSeq: 0,
  };
}

interface RequestOptions {
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

/**
 * Wire shape of a committee as returned by /api/v1/committees. Dates travel
 * as ISO strings over JSON; only the fields the tests assert on are listed.
 */
export interface CommitteeWire {
  id: string;
  name: string;
  displayName: string;
  status: string;
  type: string;
  charter: {
    missionStatement: string;
    authorityLevel: string;
    termLimits: { chairTerm: number; memberTerm: number; maxTerms: number };
    approvalDate: string;
    nextReview: string;
  };
  contactInfo: { email: string; website?: string };
  metrics: { memberCount: number; activeMembersCount: number };
  leadership: { id: string; role: string; responsibilities?: string[] }[];
  members: { id: string; expertise?: string[] }[];
  subCommitteeIds: string[];
  parentCommitteeId?: string;
  createdBy: string;
  updatedBy?: string;
}

export interface BaseMeta {
  timestamp: string;
  version: string;
}

export interface PaginationMeta extends BaseMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface Envelope<T, M extends BaseMeta = BaseMeta> {
  data: T;
  meta: M;
}

/** Parses the success envelope built by `successResponse` in src/lib/http.ts. */
export async function parseEnvelope<T, M extends BaseMeta = BaseMeta>(
  res: Response,
): Promise<Envelope<T, M>> {
  return (await res.json()) as Envelope<T, M>;
}

export async function signUpWithRole(
  registry: RunRegistry,
  label: string,
  role: string | null,
): Promise<Actor> {
  const email = `committees-d2-${label}-${registry.runId}@example.test`;
  const username = `ctte-d2-${label}-${registry.runId}`;

  const res = await auth.handler(
    new Request("http://localhost:3000/api/auth/sign-up/email", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": testIp() },
      body: JSON.stringify({
        email,
        password: PASSWORD,
        name: `Committees D2 ${label}`,
        username,
      }),
    }),
  );
  const body = (await res.json()) as { user?: { id: string } };
  if (!res.ok || !body.user) {
    throw new Error(`sign-up failed for ${label}: ${res.status} ${JSON.stringify(body)}`);
  }
  registry.userIds.push(body.user.id);

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

export async function signUpActors(registry: RunRegistry): Promise<Actors> {
  const [admin, staff, member] = await Promise.all([
    signUpWithRole(registry, "admin", "admin"),
    signUpWithRole(registry, "staff", "staff"),
    signUpWithRole(registry, "member", "member"),
  ]);
  return { admin, staff, member };
}

export function committeePayload(registry: RunRegistry, overrides: Record<string, unknown> = {}) {
  registry.payloadSeq += 1;
  const suffix = `${registry.runId}-${registry.payloadSeq}`;
  return {
    name: `ctte-${suffix}`,
    displayName: `D2 Test Committee ${suffix}`,
    description: "A test committee created by the D2 integration suite.",
    purpose: "Verify the committees API end to end.",
    status: "active",
    type: "functional",
    charter: {
      missionStatement: "Coordinate D2 integration testing for the committees module.",
      responsibilities: ["Run the committees API test suite", "Report failures to the team"],
      authorityLevel: "advisory",
      decisionMakingProcess: "Consensus among members during monthly meetings.",
      reportingStructure: "Reports to the integration test orchestrator.",
      termLimits: { chairTerm: 12, memberTerm: 12, maxTerms: 2 },
    },
    contactInfo: {
      email: `committees-d2-${suffix}@example.test`,
      phone: "+1-555-0100",
      meetingLocation: "Test Hall A",
      virtualMeetingLink: "https://meet.example.test/d2",
      website: "https://committees.example.test",
    },
    ...overrides,
  };
}

/**
 * Creates a committee through the API as the given actor and registers it
 * for cleanup. For beforeAll setup in files that need a pre-existing row but
 * are not testing creation itself.
 */
export async function seedCommittee(
  registry: RunRegistry,
  actor: Actor,
  overrides: Record<string, unknown> = {},
): Promise<CommitteeWire> {
  const res = await createCommittee(
    buildRequest(API, {
      method: "POST",
      cookie: actor.cookie,
      body: committeePayload(registry, overrides),
    }),
  );
  if (res.status !== 201) {
    throw new Error(`seed committee failed: ${res.status} ${await res.text()}`);
  }
  const { data } = await parseEnvelope<CommitteeWire>(res);
  registry.committeeIds.push(data.id);
  return data;
}

/**
 * Removes every row the file created. Order matters: members reference
 * committees, child committees reference parent committees, and committees
 * reference the users we created.
 */
export async function cleanupCommitteesRun(registry: RunRegistry): Promise<void> {
  if (registry.committeeIds.length > 0) {
    await db
      .delete(committeeMember)
      .where(inArray(committeeMember.committeeId, registry.committeeIds));
    await db.delete(committee).where(inArray(committee.parentCommitteeId, registry.committeeIds));
    await db.delete(committee).where(inArray(committee.id, registry.committeeIds));
  }
  if (registry.userIds.length > 0) {
    await db.delete(user).where(inArray(user.id, registry.userIds));
  }
}
