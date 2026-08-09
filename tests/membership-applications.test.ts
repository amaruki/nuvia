/**
 * UI-33 — membership application track (decision D10: the funnel offers
 * BOTH Stripe self-serve and an application/review track).
 *
 * Red-phase suite for /api/v1/membership-applications:
 *
 *  - POST  — signed-in members apply for a tier; validation, unknown-tier
 *            404s, and the duplicate-pending guard (same tier + same user
 *            OR same contact email) returns 409;
 *  - GET   — backoffice queue, gated on memberships:read, with tier name +
 *            applicant username joins, status filter and pagination meta;
 *  - PATCH — review decisions gated on memberships:approve, refuse
 *            re-review of decided applications (409), and audit the
 *            privileged mutation in the same transaction.
 */

import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { authLog } from "@/db/schema";
import { GET, POST } from "@/app/api/v1/membership-applications/route";
import { PATCH } from "@/app/api/v1/membership-applications/[id]/route";
import {
  API,
  buildRequest,
  createFunnelFixtures,
  ctx,
  parseEnvelope,
  parseProblem,
  type SessionFixture,
} from "./membership-funnel/fixtures";

const fx = createFunnelFixtures();

/** Public shape of an application row returned by the API. */
interface ApplicationDto {
  id: string;
  tierId: string;
  tierName: string | null;
  userId: string | null;
  name: string;
  email: string;
  organization: string | null;
  message: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  reviewedBy: string | null;
  reviewedAt: string | null;
  reviewNote: string | null;
  createdAt: string;
}

let applicant: SessionFixture;
let other: SessionFixture;
let admin: SessionFixture;
let tierId: string;
let otherTierId: string;

beforeAll(async () => {
  applicant = await fx.signUp("applicant");
  other = await fx.signUp("other-applicant");
  admin = await fx.signUp("applications-admin", "admin");
  tierId = await fx.seedTier({ displayName: `Apply ${fx.RUN_ID}` });
  otherTierId = await fx.seedTier({ displayName: `Apply Other ${fx.RUN_ID}` });
});

afterAll(async () => {
  await fx.cleanup();
});

async function postApplication(cookie: string, body: unknown): Promise<Response> {
  return POST(buildRequest(API, { method: "POST", cookie, body }));
}

describe("POST /api/v1/membership-applications", () => {
  it("requires a session", async () => {
    const res = await postApplication("", { tierId, name: "No Session", email: applicant.email });
    expect(res.status).toBe(401);
  });

  it("validates the payload", async () => {
    const res = await postApplication(applicant.cookie, {
      tierId,
      name: "",
      email: "not-an-email",
    });
    expect(res.status).toBe(422);
    const problemDoc = await parseProblem(res);
    expect(Array.isArray(problemDoc.errors)).toBe(true);
  });

  it("rejects unknown tiers", async () => {
    const res = await postApplication(applicant.cookie, {
      tierId: "00000000-0000-0000-0000-000000000000",
      name: "Ghost Tier",
      email: applicant.email,
    });
    expect(res.status).toBe(404);
  });

  it("creates a PENDING application", async () => {
    const res = await postApplication(applicant.cookie, {
      tierId,
      name: "Pat Applicant",
      email: applicant.email,
      organization: "Nuvia Chapter",
      message: "Please consider my application.",
    });
    expect(res.status).toBe(201);
    const envelope = await parseEnvelope<ApplicationDto>(res);
    fx.applicationIds.push(envelope.data.id);

    expect(envelope.data.status).toBe("PENDING");
    expect(envelope.data.tierId).toBe(tierId);
    expect(envelope.data.userId).toBe(applicant.userId);
    expect(envelope.data.name).toBe("Pat Applicant");
    expect(envelope.data.organization).toBe("Nuvia Chapter");
    expect(envelope.data.reviewedBy).toBeNull();
    expect(envelope.data.reviewedAt).toBeNull();
  });

  it("returns 409 for a duplicate pending application from the same user", async () => {
    const res = await postApplication(applicant.cookie, {
      tierId,
      name: "Pat Applicant Again",
      email: applicant.email,
    });
    expect(res.status).toBe(409);
  });

  it("returns 409 when another account applies with a pending contact email", async () => {
    const res = await postApplication(other.cookie, {
      tierId,
      name: "Impatient Other",
      // Same contact email as the applicant's pending application.
      email: applicant.email,
    });
    expect(res.status).toBe(409);
  });

  it("allows applying to a different tier while another application is pending", async () => {
    const res = await postApplication(applicant.cookie, {
      tierId: otherTierId,
      name: "Pat Applicant",
      email: applicant.email,
    });
    expect(res.status).toBe(201);
    const envelope = await parseEnvelope<ApplicationDto>(res);
    fx.applicationIds.push(envelope.data.id);
  });
});

describe("GET /api/v1/membership-applications", () => {
  it("requires a session", async () => {
    const res = await GET(buildRequest(API));
    expect(res.status).toBe(401);
  });

  it("forbids members without memberships:read", async () => {
    const res = await GET(buildRequest(API, { cookie: applicant.cookie }));
    expect(res.status).toBe(403);
  });

  it("returns the queue with tier + applicant joins and pagination meta", async () => {
    const res = await GET(buildRequest(`${API}?page=1&limit=50`, { cookie: admin.cookie }));
    expect(res.status).toBe(200);
    const envelope = await parseEnvelope<ApplicationDto[]>(res);

    const ours = envelope.data.filter((row) => row.email.endsWith(`${fx.RUN_ID}@example.test`));
    expect(ours.length).toBeGreaterThanOrEqual(2);
    for (const row of ours) {
      expect(row.tierName).toBeTruthy();
    }
    expect(envelope.meta?.page).toBe(1);
    expect(envelope.meta?.limit).toBe(50);
    expect(typeof envelope.meta?.total).toBe("number");
    expect(typeof envelope.meta?.totalPages).toBe("number");
  });

  it("filters by status", async () => {
    const res = await GET(buildRequest(`${API}?status=APPROVED`, { cookie: admin.cookie }));
    expect(res.status).toBe(200);
    const envelope = await parseEnvelope<ApplicationDto[]>(res);
    for (const row of envelope.data) {
      expect(row.status).toBe("APPROVED");
    }
  });
});

describe("PATCH /api/v1/membership-applications/[id]", () => {
  let pendingId: string;
  let rejectId: string;

  beforeAll(async () => {
    const approved = await postApplication(other.cookie, {
      tierId: otherTierId,
      name: "Other Approve",
      email: other.email,
    });
    expect(approved.status).toBe(201);
    pendingId = (await parseEnvelope<ApplicationDto>(approved)).data.id;
    fx.applicationIds.push(pendingId);

    const rejected = await postApplication(other.cookie, {
      tierId,
      name: "Other Reject",
      email: other.email,
    });
    expect(rejected.status).toBe(201);
    rejectId = (await parseEnvelope<ApplicationDto>(rejected)).data.id;
    fx.applicationIds.push(rejectId);
  });

  it("requires a session", async () => {
    const res = await PATCH(
      buildRequest(`${API}/${pendingId}`, { method: "PATCH", body: { decision: "APPROVED" } }),
      ctx({ id: pendingId }),
    );
    expect(res.status).toBe(401);
  });

  it("forbids members without memberships:approve", async () => {
    const res = await PATCH(
      buildRequest(`${API}/${pendingId}`, {
        method: "PATCH",
        cookie: applicant.cookie,
        body: { decision: "APPROVED" },
      }),
      ctx({ id: pendingId }),
    );
    expect(res.status).toBe(403);
  });

  it("returns 404 for unknown applications", async () => {
    const missingId = "00000000-0000-0000-0000-000000000000";
    const res = await PATCH(
      buildRequest(`${API}/${missingId}`, {
        method: "PATCH",
        cookie: admin.cookie,
        body: { decision: "APPROVED" },
      }),
      ctx({ id: missingId }),
    );
    expect(res.status).toBe(404);
  });

  it("validates the decision", async () => {
    const res = await PATCH(
      buildRequest(`${API}/${pendingId}`, {
        method: "PATCH",
        cookie: admin.cookie,
        body: { decision: "MAYBE" },
      }),
      ctx({ id: pendingId }),
    );
    expect(res.status).toBe(422);
  });

  it("approves a pending application and audits the decision", async () => {
    const res = await PATCH(
      buildRequest(`${API}/${pendingId}`, {
        method: "PATCH",
        cookie: admin.cookie,
        body: { decision: "APPROVED", reviewNote: "Meets all criteria" },
      }),
      ctx({ id: pendingId }),
    );
    expect(res.status).toBe(200);
    const envelope = await parseEnvelope<ApplicationDto>(res);
    expect(envelope.data.status).toBe("APPROVED");
    expect(envelope.data.reviewedBy).toBe(admin.userId);
    expect(envelope.data.reviewedAt).toBeTruthy();
    expect(envelope.data.reviewNote).toBe("Meets all criteria");

    const audits = await db.query.authLog.findMany({
      where: eq(authLog.eventType, "MEMBERSHIP_APPLICATION_REVIEWED"),
    });
    expect(audits.some((row) => row.message.includes(pendingId))).toBe(true);
  });

  it("returns 409 when re-reviewing a decided application", async () => {
    const res = await PATCH(
      buildRequest(`${API}/${pendingId}`, {
        method: "PATCH",
        cookie: admin.cookie,
        body: { decision: "REJECTED" },
      }),
      ctx({ id: pendingId }),
    );
    expect(res.status).toBe(409);
  });

  it("rejects a pending application with a note", async () => {
    const res = await PATCH(
      buildRequest(`${API}/${rejectId}`, {
        method: "PATCH",
        cookie: admin.cookie,
        body: { decision: "REJECTED", reviewNote: "Incomplete references" },
      }),
      ctx({ id: rejectId }),
    );
    expect(res.status).toBe(200);
    const envelope = await parseEnvelope<ApplicationDto>(res);
    expect(envelope.data.status).toBe("REJECTED");
    expect(envelope.data.reviewNote).toBe("Incomplete references");
  });

  it("allows re-applying after a rejection", async () => {
    const res = await postApplication(other.cookie, {
      tierId,
      name: "Other Reapply",
      email: other.email,
    });
    expect(res.status).toBe(201);
    const envelope = await parseEnvelope<ApplicationDto>(res);
    fx.applicationIds.push(envelope.data.id);
  });
});
