/**
 * UI-34 — member finance: my dues, invoices & donations.
 *
 * Red-phase suite for src/lib/services/finance/ (member-scoped reads +
 * pay-now) and the ring-1 routes under /api/v1/finance/my:
 *
 *  - own-only filtering: two seeded members, member A must never see
 *    member B's invoices — at the service layer AND over HTTP;
 *  - pay-now honesty: with PAYMENT_GATEWAY=manual the funnel returns
 *    offline guidance, settles nothing, and fabricates no amounts; with a
 *    mocked Stripe gateway it opens a real checkout for the invoice's
 *    outstanding balance;
 *  - state collisions: PAID/VOID invoices refuse pay-now;
 *  - donations: the capability report is honest about the missing schema.
 */

import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { membershipInvoice, membershipPayment, membershipTransaction } from "@/db/schema";
import { BusinessLogicError, NotFoundError } from "@/lib/errors";
import { createInvoice, voidInvoice } from "@/lib/services/invoice.service";
import { recordPayment } from "@/lib/services/payment.service";
import { createSubscription } from "@/lib/services/subscription.service";
import {
  MANUAL_PAY_GUIDANCE,
  getDonationCapability,
  getMemberFinanceSummary,
  getMemberInvoice,
  listMemberInvoices,
  payMemberInvoice,
  selectPayTrack,
} from "@/lib/services/finance";
import { GET } from "@/app/api/v1/finance/my/invoices/route";
import { GET as GET_DETAIL } from "@/app/api/v1/finance/my/invoices/[id]/route";
import { POST as PAY_NOW } from "@/app/api/v1/finance/my/invoices/[id]/pay/route";
import {
  actor,
  buildMockedStripeGateway,
  cleanupTestData,
  createTestTier,
  createTestUser,
  expectRejects,
} from "./invoice-payment/fixtures";
import {
  buildRequest,
  createFunnelFixtures,
  ctx,
  parseEnvelope,
  type SessionFixture,
} from "./membership-funnel/fixtures";
import type Stripe from "stripe";

const fx = createFunnelFixtures();
const API = "http://localhost:3000/api/v1/finance/my/invoices";

// ---------------------------------------------------------------------------
// Service layer
// ---------------------------------------------------------------------------

let userA: string;
let userB: string;
let subA: string;
let subB: string;
let invA1: string; // ISSUED, 12.00 outstanding
let invA2: string; // ISSUED, partially paid → 6.00 outstanding
let invB1: string; // member B's invoice
let numberA1: string;
let numberB1: string;

const ZERO_PAYMENTS = { before: 0, txBefore: 0 };

beforeAll(async () => {
  [userA, userB] = await Promise.all([createTestUser(), createTestUser()]);
  const tierId = await createTestTier("ui34", `UI-34 Tier`);

  const [a, b] = await Promise.all([
    createSubscription({ userId: userA, tierId, trialDays: 0 }, actor),
    createSubscription({ userId: userB, tierId, trialDays: 0 }, actor),
  ]);
  subA = a.subscription.id;
  subB = b.subscription.id;

  // Sequential: invoice numbers are generated in order.
  const invoiceA1 = await createInvoice({ subscriptionId: subA }, actor);
  const invoiceA2 = await createInvoice({ subscriptionId: subA }, actor);
  const invoiceB1 = await createInvoice({ subscriptionId: subB }, actor);
  invA1 = invoiceA1.id;
  invA2 = invoiceA2.id;
  invB1 = invoiceB1.id;
  numberA1 = invoiceA1.invoiceNumber;
  numberB1 = invoiceB1.invoiceNumber;

  // Partial payment leaves invA2 ISSUED with 6.00 outstanding.
  await recordPayment({ invoiceId: invA2, amount: "6.00", paymentMethod: "test" }, actor);

  ZERO_PAYMENTS.before = await paymentCount(invA2);
  ZERO_PAYMENTS.txBefore = await txCount(subA);
}, 30_000);

afterAll(async () => {
  await cleanupTestData();
  await fx.cleanup();
});

async function paymentCount(invoiceId: string): Promise<number> {
  const rows = await db.query.membershipPayment.findMany({
    where: eq(membershipPayment.invoiceId, invoiceId),
  });
  return rows.length;
}

async function txCount(subscriptionId: string): Promise<number> {
  const rows = await db.query.membershipTransaction.findMany({
    where: eq(membershipTransaction.subscriptionId, subscriptionId),
  });
  return rows.length;
}

describe("UI-34 own-only invoice reads (service layer)", () => {
  it("lists only the caller's invoices", async () => {
    const { invoices, total } = await listMemberInvoices(userA, {});
    expect(total).toBe(2);
    const numbers = invoices.map((invoice) => invoice.invoiceNumber);
    expect(numbers).toContain(numberA1);
    expect(numbers).not.toContain(numberB1);
    for (const invoice of invoices) {
      expect(invoice.id === invA1 || invoice.id === invA2).toBe(true);
    }
  });

  it("sums the outstanding balance from own invoices only", async () => {
    const summary = await getMemberFinanceSummary(userA);
    expect(summary.outstandingBalance).toBe("18.00");
    expect(summary.outstandingInvoiceCount).toBe(2);

    const summaryB = await getMemberFinanceSummary(userB);
    expect(summaryB.outstandingBalance).toBe("12.00");
    expect(summaryB.outstandingInvoiceCount).toBe(1);
  });

  it("projects an allow-list — no internal columns leak", async () => {
    const { invoices } = await listMemberInvoices(userA, {});
    const [dto] = invoices;
    expect(dto).toBeDefined();
    expect(typeof dto.outstandingAmount).toBe("string");
    expect("metadata" in dto).toBe(false);
    expect("tierId" in dto).toBe(false);
    expect("subscriptionId" in dto).toBe(false);
  });

  it("hides another member's invoice behind NotFoundError", async () => {
    await expect(getMemberInvoice(userA, invB1)).rejects.toBeInstanceOf(NotFoundError);
    await expect(
      getMemberInvoice(userA, "00000000-0000-0000-0000-000000000000"),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("refuses pay-now against another member's invoice without leaking it", async () => {
    await expect(
      payMemberInvoice({ userId: userA, invoiceId: invB1 }, actor),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe("UI-34 pay-now — manual track honesty", () => {
  it("selects the manual track when no gateway is configured", () => {
    expect(selectPayTrack()).toBe("manual");
  });

  it("returns offline guidance, settles nothing, fabricates no amount", async () => {
    const result = await payMemberInvoice({ userId: userA, invoiceId: invA2 }, actor);

    expect(result.track).toBe("manual");
    if (result.track !== "manual") throw new Error("unreachable");
    expect(result.paymentStatus).toBe("unpaid");
    expect(result.checkoutUrl).toBeNull();
    expect(result.providerTxId).toBeNull();
    expect(result.guidance).toEqual(MANUAL_PAY_GUIDANCE);

    // Honest copy: names the offline step, fabricates no amounts.
    const text = MANUAL_PAY_GUIDANCE.join(" ").toLowerCase();
    expect(text).toContain("manual");
    expect(text).not.toContain("$");

    // Nothing settled: no new payment/ledger rows, invoice unchanged.
    expect(await paymentCount(invA2)).toBe(ZERO_PAYMENTS.before);
    expect(await txCount(subA)).toBe(ZERO_PAYMENTS.txBefore);
    const [row] = await db.select().from(membershipInvoice).where(eq(membershipInvoice.id, invA2));
    expect(row.status).toBe("ISSUED");
    expect(row.paidAmount).toBe("6.00");
  });
});

describe("UI-34 pay-now — stripe track (mocked client, real adapter logic)", () => {
  it("opens a checkout for exactly the outstanding balance", async () => {
    const mocked = buildMockedStripeGateway({
      createSession: () =>
        ({
          id: `cs_ui34_${Date.now()}`,
          payment_intent: `pi_ui34_${Date.now()}`,
          url: `https://checkout.stripe.com/c/pay/cs_ui34`,
        }) as Stripe.Checkout.Session,
    });

    const result = await payMemberInvoice(
      {
        userId: userA,
        invoiceId: invA1,
        returnUrl: "https://app.test/dashboard/my/finance",
        gateway: mocked.gateway,
      },
      actor,
    );

    expect(result.track).toBe("stripe");
    if (result.track !== "stripe") throw new Error("unreachable");
    // Pending until the verified webhook confirms — never paid optimistically.
    expect(result.paymentStatus).toBe("pending");
    expect(result.checkoutUrl).toBe("https://checkout.stripe.com/c/pay/cs_ui34");

    const session = mocked.calls.sessions[0];
    expect(session.mode).toBe("payment");
    expect(session.line_items?.[0]?.price_data?.unit_amount).toBe(1200);
    expect(session.client_reference_id).toBe(userA);
    expect(session.metadata?.invoiceId).toBe(invA1);
    expect(session.metadata?.subscriptionId).toBe(subA);
    expect(session.success_url).toBe("https://app.test/dashboard/my/finance");
  });
});

describe("UI-34 pay-now — state collisions", () => {
  it("refuses to pay a settled invoice", async () => {
    await recordPayment({ invoiceId: invA1, amount: "12.00", paymentMethod: "test" }, actor);
    await expectRejects(
      () => payMemberInvoice({ userId: userA, invoiceId: invA1 }, actor),
      "INVOICE_NOT_PAYABLE",
      BusinessLogicError,
    );
  });

  it("refuses to pay a void invoice", async () => {
    await voidInvoice(invA2, actor);
    await expectRejects(
      () => payMemberInvoice({ userId: userA, invoiceId: invA2 }, actor),
      "INVOICE_NOT_PAYABLE",
      BusinessLogicError,
    );
  });
});

describe("UI-34 donation capability — honest gap report", () => {
  it("reports that no donation store exists and fabricates nothing", () => {
    const capability = getDonationCapability();
    expect(capability.available).toBe(false);
    expect(capability.reason.toLowerCase()).toContain("schema");
    // Points at what DOES exist instead of inventing a donation flow.
    expect(capability.alternatives.some((option) => option.href === "/membership")).toBe(true);
    expect("campaigns" in capability).toBe(false);
    expect("suggestedAmounts" in capability).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Ring-1 routes (/api/v1/finance/my) — session-gated, own-only over HTTP
// ---------------------------------------------------------------------------

describe("UI-34 member finance routes", () => {
  let memberA: SessionFixture;
  let memberB: SessionFixture;
  let routeInvA: string;
  let routeInvB: string;
  let routeNumberB: string;

  beforeAll(async () => {
    [memberA, memberB] = await Promise.all([fx.signUp("fin-member-a"), fx.signUp("fin-member-b")]);
    const tierId = await fx.seedTier({ displayName: `UI-34 Route ${fx.RUN_ID}` });

    const [a, b] = await Promise.all([
      createSubscription({ userId: memberA.userId, tierId, trialDays: 0 }, actor),
      createSubscription({ userId: memberB.userId, tierId, trialDays: 0 }, actor),
    ]);
    const invoiceA = await createInvoice({ subscriptionId: a.subscription.id }, actor);
    const invoiceB = await createInvoice({ subscriptionId: b.subscription.id }, actor);
    routeInvA = invoiceA.id;
    routeInvB = invoiceB.id;
    routeNumberB = invoiceB.invoiceNumber;
  }, 30_000);

  it("requires a session", async () => {
    const res = await GET(buildRequest(API));
    expect(res.status).toBe(401);
    const pay = await PAY_NOW(
      buildRequest(`${API}/${routeInvA}/pay`, { method: "POST" }),
      ctx({ id: routeInvA }),
    );
    expect(pay.status).toBe(401);
  });

  it("returns only the signed-in member's invoices", async () => {
    const res = await GET(buildRequest(API, { cookie: memberA.cookie }));
    expect(res.status).toBe(200);
    const envelope = await parseEnvelope<{ invoices: { invoiceNumber: string }[] }>(res);
    expect(envelope.data.invoices).toHaveLength(1);
    expect(envelope.data.invoices[0].invoiceNumber).not.toBe(routeNumberB);

    const resB = await GET(buildRequest(API, { cookie: memberB.cookie }));
    const envelopeB = await parseEnvelope<{ invoices: { invoiceNumber: string }[] }>(resB);
    expect(envelopeB.data.invoices).toHaveLength(1);
    expect(envelopeB.data.invoices[0].invoiceNumber).toBe(routeNumberB);
  });

  it("404s on another member's invoice detail instead of leaking it", async () => {
    const res = await GET_DETAIL(
      buildRequest(`${API}/${routeInvB}`, { cookie: memberA.cookie }),
      ctx({ id: routeInvB }),
    );
    expect(res.status).toBe(404);

    const own = await GET_DETAIL(
      buildRequest(`${API}/${routeInvA}`, { cookie: memberA.cookie }),
      ctx({ id: routeInvA }),
    );
    expect(own.status).toBe(200);
    const envelope = await parseEnvelope<{ invoice: { items: unknown[] } }>(own);
    expect(Array.isArray(envelope.data.invoice.items)).toBe(true);
  });

  it("pay-now over HTTP: manual track returns honest guidance, settles nothing", async () => {
    const res = await PAY_NOW(
      buildRequest(`${API}/${routeInvA}/pay`, { method: "POST", cookie: memberA.cookie }),
      ctx({ id: routeInvA }),
    );
    expect(res.status).toBe(200);
    const envelope = await parseEnvelope<{
      track: string;
      paymentStatus: string;
      checkoutUrl: string | null;
      guidance?: string[];
    }>(res);
    expect(envelope.data.track).toBe("manual");
    expect(envelope.data.paymentStatus).toBe("unpaid");
    expect(envelope.data.checkoutUrl).toBeNull();
    expect(envelope.data.guidance?.length).toBeGreaterThan(0);

    const [row] = await db
      .select()
      .from(membershipInvoice)
      .where(eq(membershipInvoice.id, routeInvA));
    expect(row.status).toBe("ISSUED");
    expect(row.paidAmount).toBe("0.00");
  });

  it("pay-now over HTTP refuses another member's invoice", async () => {
    const res = await PAY_NOW(
      buildRequest(`${API}/${routeInvB}/pay`, { method: "POST", cookie: memberA.cookie }),
      ctx({ id: routeInvB }),
    );
    expect(res.status).toBe(404);
  });
});
