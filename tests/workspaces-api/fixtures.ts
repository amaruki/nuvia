/**
 * D5 — Workspaces API integration suite: shared fixtures.
 *
 * The suite covers the workspaces CRUD surface end to end against the shared
 * test database (DATABASE_URL from .env): authentication and per-action
 * RBAC, payload validation, duplicate-name and status conflicts, list
 * filtering/search/roster scopes with the {data, meta} envelope, patching
 * (including clearing optional fields), delete gating, and the service layer
 * directly. Each concern lives in its own *.test.ts file in this folder.
 *
 * createFixtures() gives every test file its own RUN_ID and cleanup
 * registry: bun runs all files in one process, so a module-level RUN_ID
 * would collide across files on the unique workspace names and sign-up
 * usernames. Every row a file creates is name-isolated by its RUN_ID and
 * removed by cleanup(), so each file stays self-cleaning and safe to run
 * alongside other test files.
 */

import { eq, inArray, like } from "drizzle-orm";
import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db/client";
import { committee, user, workspace } from "@/db/schema";
import type { WorkspaceSettingsInput } from "@/lib/services/workspace.service";
import { testIp } from "../helpers";

export const PASSWORD = "Sup3r-Secret-Passw0rd!";
export const API = "http://localhost:3000/api/v1/workspaces";

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

export function settingsPayload(): WorkspaceSettingsInput {
  return {
    isPublic: false,
    allowGuestAccess: false,
    requireApproval: true,
    enableNotifications: true,
    autoArchiveDays: 365,
    maxFileSize: 50,
    allowedFileTypes: [".pdf", ".docx"],
    memberPermissions: [
      { role: "chair", permissions: ["view", "edit", "manage_members"] },
      { role: "member", permissions: ["view", "download"] },
    ],
  };
}

/** One isolated fixture set; create one per test file. */
export function createFixtures() {
  const RUN_ID = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

  const userIds: string[] = [];
  const workspaceIds: string[] = [];
  const committeeIds: string[] = [];

  /** Values shared between ordered tests within a file. */
  const state: Record<string, string> = {};

  async function signUpWithRole(label: string, role: string | null) {
    const email = `d5-${label}-${RUN_ID}@example.test`;
    const username = `d5-${label}-${RUN_ID}`;

    const res = await auth.handler(
      new Request("http://localhost:3000/api/auth/sign-up/email", {
        method: "POST",
        headers: { "content-type": "application/json", "x-forwarded-for": testIp() },
        body: JSON.stringify({
          email,
          password: PASSWORD,
          name: `Workspaces D5 ${label}`,
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

  function workspacePayload(suffix: string, overrides: Record<string, unknown> = {}) {
    return {
      name: `d5-workspace-${suffix}-${RUN_ID}`,
      description: `D5 test workspace ${suffix}`,
      type: "general",
      settings: settingsPayload(),
      ...overrides,
    };
  }

  /** Fixture committee for the committee-link assertions. */
  async function seedCommittee(createdBy: string) {
    const [row] = await db
      .insert(committee)
      .values({
        name: `d5-committee-${RUN_ID}`,
        displayName: `D5 Committee ${RUN_ID}`,
        purpose: "Fixture committee for the D5 workspaces suite",
        contactEmail: `committee-${RUN_ID}@example.test`,
        createdBy,
      })
      .returning();
    committeeIds.push(row.id);
    state.committeeId = row.id;
    return row.id;
  }

  async function cleanup() {
    // FK order: workspaces before users/committees. The name sweep catches
    // anything an assertion-aborted test left behind.
    if (workspaceIds.length > 0) {
      await db.delete(workspace).where(inArray(workspace.id, workspaceIds));
    }
    await db.delete(workspace).where(like(workspace.name, `%${RUN_ID}%`));
    if (committeeIds.length > 0) {
      await db.delete(committee).where(inArray(committee.id, committeeIds));
    }
    if (userIds.length > 0) {
      await db.delete(user).where(inArray(user.id, userIds));
    }
  }

  return {
    RUN_ID,
    state,
    workspaceIds,
    signUpWithRole,
    workspacePayload,
    seedCommittee,
    cleanup,
  };
}
