/**
 * D2 — Committees API integration tests: listing and filters.
 *
 * Covers RUN_ID-scoped list filters (search, status, type, memberCountMin)
 * with pagination meta, and pagination math consistency.
 *
 * Runs against the shared test database (DATABASE_URL from .env). Every row
 * this file creates is RUN_ID-isolated and removed in afterAll, so the file
 * is self-cleaning and safe to run alongside other test files.
 */

import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { db } from "@/db/client";
import { committeeMember } from "@/db/schema";

import { GET as listCommittees } from "@/app/api/v1/committees/route";
import { PATCH as updateCommittee } from "@/app/api/v1/committees/[id]/route";

import {
  API,
  buildRequest,
  cleanupCommitteesRun,
  createRegistry,
  parseEnvelope,
  seedCommittee,
  signUpWithRole,
  type Actor,
  type CommitteeWire,
  type PaginationMeta,
} from "./fixtures";

const registry = createRegistry();

/** Values shared between ordered tests within this file. */
const state: Record<string, string> = {};

let admin: Actor = { userId: "", cookie: "" };

beforeAll(async () => {
  admin = await signUpWithRole(registry, "admin", "admin");

  // Reproduce the state the filter tests assert against: three RUN_ID-scoped
  // committees, one of them inactive and exactly one holding two members.
  const withMembers = await seedCommittee(registry, admin);
  state.committeeId = withMembers.id;
  await seedCommittee(registry, admin);
  const inactive = await seedCommittee(registry, admin);

  const patched = await updateCommittee(
    buildRequest(`${API}/${inactive.id}`, {
      method: "PATCH",
      cookie: admin.cookie,
      body: { status: "inactive" },
    }),
    { params: Promise.resolve({ id: inactive.id }) },
  );
  if (patched.status !== 200) {
    throw new Error(`failed to mark seed committee inactive: ${patched.status}`);
  }

  await db.insert(committeeMember).values({
    committeeId: state.committeeId,
    userId: admin.userId,
    name: "Chair Person",
    email: `chair-${registry.runId}@example.test`,
    role: "chair",
    title: "Committee Chair",
    responsibilities: ["Set the agenda", "Represent the committee"],
  });
  await db.insert(committeeMember).values({
    committeeId: state.committeeId,
    name: "Regular Member",
    email: `member-${registry.runId}@example.test`,
    role: "member",
    expertise: ["testing", "documentation"],
  });
});

afterAll(async () => {
  await cleanupCommitteesRun(registry);
});

describe("committees listing", () => {
  test("list filters scope to this run and expose pagination meta", async () => {
    const scoped = `${API}?search=${registry.runId}&limit=100`;

    const all = await parseEnvelope<CommitteeWire[], PaginationMeta>(
      await listCommittees(buildRequest(scoped, { cookie: admin.cookie })),
    );
    const total = all.meta.total;
    expect(total).toBeGreaterThanOrEqual(3);
    expect(all.data.every((c) => c.displayName.includes(registry.runId))).toBe(true);

    const inactive = await parseEnvelope<CommitteeWire[], PaginationMeta>(
      await listCommittees(buildRequest(`${scoped}&status=inactive`, { cookie: admin.cookie })),
    );
    expect(inactive.data.length).toBeGreaterThanOrEqual(1);
    expect(inactive.data.every((c) => c.status === "inactive")).toBe(true);

    const bogusStatus = await parseEnvelope<CommitteeWire[], PaginationMeta>(
      await listCommittees(buildRequest(`${scoped}&status=bogus`, { cookie: admin.cookie })),
    );
    expect(bogusStatus.meta.total).toBe(total);

    // member counts come from committee_members rows; only the first committee has two
    const minOne = await parseEnvelope<CommitteeWire[], PaginationMeta>(
      await listCommittees(buildRequest(`${scoped}&memberCountMin=1`, { cookie: admin.cookie })),
    );
    expect(minOne.meta.total).toBe(1);
    expect(minOne.data[0].id).toBe(state.committeeId);

    const typeFilter = await parseEnvelope<CommitteeWire[], PaginationMeta>(
      await listCommittees(buildRequest(`${scoped}&type=functional`, { cookie: admin.cookie })),
    );
    expect(typeFilter.meta.total).toBe(total);
  });

  test("pagination meta is consistent", async () => {
    const res = await listCommittees(
      buildRequest(`${API}?search=${registry.runId}&page=1&limit=2`, { cookie: admin.cookie }),
    );
    expect(res.status).toBe(200);
    const { data, meta } = await parseEnvelope<CommitteeWire[], PaginationMeta>(res);
    expect(data.length).toBeLessThanOrEqual(2);
    expect(meta.page).toBe(1);
    expect(meta.limit).toBe(2);
    expect(meta.total).toBeGreaterThanOrEqual(data.length);
    expect(meta.totalPages).toBe(Math.max(1, Math.ceil(meta.total / meta.limit)));

    const page2 = await parseEnvelope<CommitteeWire[], PaginationMeta>(
      await listCommittees(
        buildRequest(`${API}?search=${registry.runId}&page=2&limit=2`, { cookie: admin.cookie }),
      ),
    );
    expect(page2.meta.page).toBe(2);
    if (meta.total > 2) {
      expect(page2.data.length).toBeGreaterThan(0);
    }
  });
});
