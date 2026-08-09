/**
 * UI-33 — membership join funnel suites: shared fixtures.
 *
 * Two test files share this module (bun runs every file in one process):
 * - membership-join-flow.test.ts — service-level funnel (catalog projection,
 *   track selection, Stripe checkout with a mocked client, honest manual
 *   fallback, verified-webhook completion).
 * - membership-applications.test.ts — the /api/v1/membership-applications
 *   routes (session gating, validation, duplicate-pending conflicts,
 *   backoffice review permissions).
 *
 * createFunnelFixtures() gives each file its own RUN_ID and cleanup registry;
 * every row is RUN_ID-isolated and removed by cleanup() so both files stay
 * self-cleaning alongside the rest of the suite. Tests push created ids into
 * the exposed registries so cleanup removes exactly what the run created.
 */

import { and, eq, inArray, like } from "drizzle-orm";
import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db/client";
import { membershipApplication, membershipTier, membershipWebhookEvent, user } from "@/db/schema";
import { createTier } from "@/lib/services/membership-tier.service";
import type { CreateTierInput } from "@/lib/validation/finance.validation";
import { testIp } from "../helpers";

export const PASSWORD = "Sup3r-Secret-Passw0rd!";
export const API = "http://localhost:3000/api/v1/membership-applications";

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

/** The project success envelope (docs/api/conventions.md). */
export interface Envelope<TData> {
  data: TData;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    [key: string]: unknown;
  };
}

/** RFC 9457 problem document shape. */
export interface ProblemDoc {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  errors?: { field: string; message: string }[];
}

export async function parseEnvelope<TData>(res: Response): Promise<Envelope<TData>> {
  return (await res.json()) as Envelope<TData>;
}

export async function parseProblem(res: Response): Promise<ProblemDoc> {
  return (await res.json()) as ProblemDoc;
}

export interface SessionFixture {
  userId: string;
  email: string;
  cookie: string;
}

/** One isolated fixture set; create one per test file. */
export function createFunnelFixtures() {
  const RUN_ID = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

  const userIds: string[] = [];
  const tierIds: string[] = [];
  /** Tests push created application ids here so cleanup removes them. */
  const applicationIds: string[] = [];
  /** Webhook idempotency claims have no FK; tests register them for cleanup. */
  const webhookEvents: { provider: string; eventId: string }[] = [];

  /** Full better-auth sign-up; optional role re-signs-in so the session sees it. */
  async function signUp(label: string, role: string | null = null): Promise<SessionFixture> {
    const email = `ui33-${label}-${RUN_ID}@example.test`;
    const username = `ui33-${label}-${RUN_ID}`;

    const res = await auth.handler(
      new Request("http://localhost:3000/api/auth/sign-up/email", {
        method: "POST",
        headers: { "content-type": "application/json", "x-forwarded-for": testIp() },
        body: JSON.stringify({
          email,
          password: PASSWORD,
          name: `UI-33 ${label}`,
          username,
        }),
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

  /** Fixture tier through the real tier service; RUN_ID names keep it unique. */
  async function seedTier(overrides: Partial<CreateTierInput> = {}): Promise<string> {
    const tier = await createTier({
      name: `ui33-${RUN_ID}-${tierIds.length}`,
      displayName: `UI-33 Tier ${RUN_ID} ${tierIds.length}`,
      description: "Fixture tier for the UI-33 join funnel suite",
      price: "49.00",
      billingCycle: "monthly",
      features: ["Voting rights"],
      benefits: ["Monthly newsletter"],
      ...overrides,
    });
    tierIds.push(tier.id);
    return tier.id;
  }

  async function cleanup(): Promise<void> {
    // Webhook idempotency claims have no FK — remove them explicitly.
    for (const claim of webhookEvents) {
      await db
        .delete(membershipWebhookEvent)
        .where(
          and(
            eq(membershipWebhookEvent.provider, claim.provider),
            eq(membershipWebhookEvent.eventId, claim.eventId),
          ),
        );
    }
    // Applications reference tiers and users, so they go before both. The
    // email sweep catches rows an assertion-aborted test left behind.
    if (applicationIds.length > 0) {
      await db
        .delete(membershipApplication)
        .where(inArray(membershipApplication.id, applicationIds));
    }
    await db.delete(membershipApplication).where(like(membershipApplication.email, `%${RUN_ID}%`));
    // Users cascade subscriptions/transactions/audit rows.
    if (userIds.length > 0) {
      await db.delete(user).where(inArray(user.id, userIds));
    }
    if (tierIds.length > 0) {
      await db.delete(membershipTier).where(inArray(membershipTier.id, tierIds));
    }
  }

  return { RUN_ID, signUp, seedTier, applicationIds, webhookEvents, cleanup };
}
