/**
 * Finance dashboard reporting — C4.
 *
 * Read-only computations over the membership finance tables that C2/C3
 * landed (tiers, subscriptions, invoices, payments, transactions). Nothing
 * here writes, and nothing here changes C2/C3 service behavior — the
 * dashboard pages read these aggregates instead of the mock data they
 * shipped with.
 *
 * Money rules follow docs/adr/0015-payment-gateway-adapter-stripe-first.md
 * §5: numeric(10,2) columns travel as strings; sums use exact integer
 * minor-unit arithmetic via toMinorUnits/toAmountString, never floats.
 *
 * There are deliberately NO budget or donation aggregates here: the schema
 * has no budget/donation tables, and the dashboard must not pretend
 * otherwise (those pages render honest empty states instead).
 */

import { asc, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db/client";
import {
  membershipInvoice,
  membershipInvoiceItem,
  membershipTier,
  membershipTransaction,
  user,
} from "@/db/schema";

import { toAmountString, toMinorUnits } from "@/lib/payments/gateway";
import { env } from "@/lib/env";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Monthly revenue bucket computed from COMPLETED membership transactions. */
export interface RevenuePeriodRow {
  /** Calendar month key, e.g. "2025-06". */
  period: string;
  /** Sum of completed transaction amounts, string-mode. */
  revenue: string;
  transactionCount: number;
}

/** Revenue grouped by the tier each transaction was billed for. */
export interface RevenueByTierRow {
  tierId: string;
  tierName: string;
  revenue: string;
  transactionCount: number;
}

/** Receivables still open on ISSUED invoices. */
export interface OutstandingSummary {
  invoiceCount: number;
  /** Sum of (totalAmount - paidAmount) across ISSUED invoices. */
  outstandingAmount: string;
  overdueCount: number;
  overdueAmount: string;
}

export interface FinanceReportSummary {
  generatedAt: string;
  /** Window (in months) the revenue aggregates cover. */
  months: number;
  totals: {
    revenue: string;
    completedTransactionCount: number;
  };
  revenueByPeriod: RevenuePeriodRow[];
  revenueByTier: RevenueByTierRow[];
  outstanding: OutstandingSummary;
}

/**
 * Dashboard-facing dues status. Derived from the real invoice columns:
 * PAID -> "paid", VOID -> "cancelled", ISSUED splits into "overdue"
 * (due date in the past), "partial" (paidAmount > 0) and "pending".
 */
export type DuesUiStatus = "pending" | "partial" | "paid" | "overdue" | "cancelled";

export interface DuesLedgerRow {
  invoiceId: string;
  invoiceNumber: string | null;
  subscriptionId: string;
  memberId: string | null;
  memberName: string | null;
  memberEmail: string | null;
  tierId: string | null;
  tierName: string | null;
  amount: string;
  paid: string;
  balance: string;
  issuedAt: Date;
  dueDate: Date | null;
  status: DuesUiStatus;
}

/** Invoice row shaped for the dashboard, with member/tier context + items. */
export interface InvoiceClientRow {
  invoiceId: string;
  invoiceNumber: string | null;
  subscriptionId: string;
  memberId: string | null;
  memberName: string | null;
  memberEmail: string | null;
  tierId: string | null;
  tierName: string | null;
  amount: string;
  paid: string;
  balance: string;
  issuedAt: Date;
  dueDate: Date | null;
  /** "sent" = ISSUED and not overdue; "overdue" = ISSUED past dueDate. */
  status: "sent" | "paid" | "overdue" | "cancelled";
  items: { description: string; quantity: number; unitPrice: string }[];
}

export interface ListResult<T> {
  rows: T[];
  total: number;
}

export interface DuesLedgerQuery {
  status?: DuesUiStatus | "all";
  page?: number;
  limit?: number;
}

export interface InvoiceClientQuery {
  status?: "sent" | "paid" | "overdue" | "cancelled" | "all";
  userId?: string;
  page?: number;
  limit?: number;
}

/**
 * Deployment-configured gateway, safe to expose: provider + status +
 * booleans about credential presence. NEVER secret values.
 */
export interface ConfiguredGatewayStatus {
  provider: "manual" | "stripe";
  displayName: string;
  status: "active";
  description: string;
  /** Where provider webhooks land, when applicable. */
  webhookEndpoint: string | null;
  /** Stripe only: secret key present in the deployment env. */
  secretKeyConfigured: boolean | null;
  /** Stripe only: webhook signing secret present in the deployment env. */
  webhookSecretConfigured: boolean | null;
}

// ---------------------------------------------------------------------------
// Internals
// ---------------------------------------------------------------------------

const MAX_AGGREGATE_ROWS = 1000;

const periodKey = (date: Date): string =>
  `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;

function windowStart(months: number, now: Date): Date {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  start.setUTCMonth(start.getUTCMonth() - (months - 1));
  return start;
}

function deriveDuesStatus(
  invoice: { status: "ISSUED" | "PAID" | "VOID"; paidAmount: string; dueDate: Date | null },
  now: Date,
): DuesUiStatus {
  if (invoice.status === "PAID") return "paid";
  if (invoice.status === "VOID") return "cancelled";
  if (invoice.dueDate !== null && invoice.dueDate.getTime() < now.getTime()) return "overdue";
  if (toMinorUnits(invoice.paidAmount) > 0) return "partial";
  return "pending";
}

/** One query for the ledger/invoice joins, ordered newest-first. */
async function fetchInvoicesWithClientContext(userId?: string) {
  const invoices = await db
    .select({
      invoiceId: membershipInvoice.id,
      invoiceNumber: membershipInvoice.invoiceNumber,
      subscriptionId: membershipInvoice.subscriptionId,
      status: membershipInvoice.status,
      totalAmount: membershipInvoice.totalAmount,
      paidAmount: membershipInvoice.paidAmount,
      issuedAt: membershipInvoice.createdAt,
      dueDate: membershipInvoice.dueDate,
      memberId: user.id,
      memberName: user.name,
      memberEmail: user.email,
      tierId: membershipInvoice.tierId,
      tierName: membershipTier.name,
    })
    .from(membershipInvoice)
    .leftJoin(user, eq(membershipInvoice.userId, user.id))
    .leftJoin(membershipTier, eq(membershipInvoice.tierId, membershipTier.id))
    .orderBy(desc(membershipInvoice.createdAt), asc(membershipInvoice.id))
    .limit(MAX_AGGREGATE_ROWS);

  return userId ? invoices.filter((row) => row.memberId === userId) : invoices;
}

async function fetchItemsForInvoices(invoiceIds: string[]) {
  if (invoiceIds.length === 0) return new Map<string, InvoiceClientRow["items"]>();

  const items = await db
    .select({
      invoiceId: membershipInvoiceItem.invoiceId,
      description: membershipInvoiceItem.description,
      quantity: membershipInvoiceItem.quantity,
      unitPrice: membershipInvoiceItem.unitPrice,
    })
    .from(membershipInvoiceItem)
    .where(inArray(membershipInvoiceItem.invoiceId, invoiceIds))
    .orderBy(asc(membershipInvoiceItem.createdAt), asc(membershipInvoiceItem.id));

  const wanted = new Set(invoiceIds);
  const grouped = new Map<string, InvoiceClientRow["items"]>();
  for (const item of items) {
    if (!wanted.has(item.invoiceId)) continue;
    const list = grouped.get(item.invoiceId) ?? [];
    list.push({
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    });
    grouped.set(item.invoiceId, list);
  }
  return grouped;
}

// ---------------------------------------------------------------------------
// Revenue + receivables
// ---------------------------------------------------------------------------

/**
 * Monthly revenue over COMPLETED transactions in the trailing `months`
 * window (inclusive of the current month). Empty months are included so the
 * dashboard can render a continuous trend.
 */
export async function getRevenueByPeriod(opts?: {
  months?: number;
  now?: Date;
}): Promise<RevenuePeriodRow[]> {
  const months = Math.min(Math.max(opts?.months ?? 12, 1), 36);
  const now = opts?.now ?? new Date();
  const since = windowStart(months, now);

  const transactions = await db
    .select({
      amount: membershipTransaction.amount,
      createdAt: membershipTransaction.createdAt,
    })
    .from(membershipTransaction)
    .where(eq(membershipTransaction.status, "COMPLETED"))
    .orderBy(asc(membershipTransaction.createdAt))
    .limit(MAX_AGGREGATE_ROWS);

  const totalsByPeriod = new Map<string, { minor: number; count: number }>();
  for (const tx of transactions) {
    if (tx.createdAt.getTime() < since.getTime()) continue;
    const key = periodKey(tx.createdAt);
    const bucket = totalsByPeriod.get(key) ?? { minor: 0, count: 0 };
    bucket.minor += toMinorUnits(tx.amount);
    bucket.count += 1;
    totalsByPeriod.set(key, bucket);
  }

  // Continuous month series, oldest first.
  const rows: RevenuePeriodRow[] = [];
  const cursor = new Date(since);
  while (cursor.getTime() <= now.getTime()) {
    const key = periodKey(cursor);
    const bucket = totalsByPeriod.get(key);
    rows.push({
      period: key,
      revenue: toAmountString(bucket?.minor ?? 0),
      transactionCount: bucket?.count ?? 0,
    });
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }
  return rows;
}

/**
 * Revenue grouped by tier over the same window. Tiers are identified via
 * transaction.tierId; a null tierId (defensive — C3 always sets it) is
 * bucketed under a labelled "Unassigned" row only when present.
 */
export async function getRevenueByTier(opts?: {
  months?: number;
  now?: Date;
}): Promise<RevenueByTierRow[]> {
  const months = Math.min(Math.max(opts?.months ?? 12, 1), 36);
  const now = opts?.now ?? new Date();
  const since = windowStart(months, now);

  const transactions = await db
    .select({
      amount: membershipTransaction.amount,
      createdAt: membershipTransaction.createdAt,
      tierId: membershipTransaction.tierId,
    })
    .from(membershipTransaction)
    .where(eq(membershipTransaction.status, "COMPLETED"))
    .limit(MAX_AGGREGATE_ROWS);

  const tiers = await db
    .select({ id: membershipTier.id, name: membershipTier.name })
    .from(membershipTier);
  const tierNames = new Map(tiers.map((tier) => [tier.id, tier.name]));

  const totalsByTier = new Map<string, { minor: number; count: number }>();
  for (const tx of transactions) {
    if (tx.createdAt.getTime() < since.getTime()) continue;
    const key = tx.tierId ?? "__unassigned__";
    const bucket = totalsByTier.get(key) ?? { minor: 0, count: 0 };
    bucket.minor += toMinorUnits(tx.amount);
    bucket.count += 1;
    totalsByTier.set(key, bucket);
  }

  return Array.from(totalsByTier.entries())
    .map(([tierId, bucket]) => ({
      tierId,
      tierName:
        tierId === "__unassigned__" ? "Unassigned" : (tierNames.get(tierId) ?? "Unknown tier"),
      revenue: toAmountString(bucket.minor),
      transactionCount: bucket.count,
    }))
    .sort((a, b) => toMinorUnits(b.revenue) - toMinorUnits(a.revenue));
}

/** Receivables still open on ISSUED invoices, with overdue split. */
export async function getOutstandingSummary(opts?: { now?: Date }): Promise<OutstandingSummary> {
  const now = opts?.now ?? new Date();

  const invoices = await db
    .select({
      totalAmount: membershipInvoice.totalAmount,
      paidAmount: membershipInvoice.paidAmount,
      dueDate: membershipInvoice.dueDate,
    })
    .from(membershipInvoice)
    .where(eq(membershipInvoice.status, "ISSUED"))
    .limit(MAX_AGGREGATE_ROWS);

  let outstandingMinor = 0;
  let overdueMinor = 0;
  let overdueCount = 0;
  for (const invoice of invoices) {
    const balance = toMinorUnits(invoice.totalAmount) - toMinorUnits(invoice.paidAmount);
    outstandingMinor += balance;
    if (invoice.dueDate !== null && invoice.dueDate.getTime() < now.getTime()) {
      overdueMinor += balance;
      overdueCount += 1;
    }
  }

  return {
    invoiceCount: invoices.length,
    outstandingAmount: toAmountString(outstandingMinor),
    overdueCount,
    overdueAmount: toAmountString(overdueMinor),
  };
}

/** One call for the reports dashboard: every aggregate + window metadata. */
export async function getFinanceReportSummary(opts?: {
  months?: number;
  now?: Date;
}): Promise<FinanceReportSummary> {
  const months = Math.min(Math.max(opts?.months ?? 12, 1), 36);
  const now = opts?.now ?? new Date();

  const [revenueByPeriod, revenueByTier, outstanding] = await Promise.all([
    getRevenueByPeriod({ months, now }),
    getRevenueByTier({ months, now }),
    getOutstandingSummary({ now }),
  ]);

  const revenueMinor = revenueByPeriod.reduce((sum, row) => sum + toMinorUnits(row.revenue), 0);
  const completedTransactionCount = revenueByPeriod.reduce(
    (sum, row) => sum + row.transactionCount,
    0,
  );

  return {
    generatedAt: now.toISOString(),
    months,
    totals: {
      revenue: toAmountString(revenueMinor),
      completedTransactionCount,
    },
    revenueByPeriod,
    revenueByTier,
    outstanding,
  };
}

// ---------------------------------------------------------------------------
// Dues ledger + invoice listings
// ---------------------------------------------------------------------------

/**
 * Org-wide dues ledger: every invoice joined to its member and tier, with a
 * derived dashboard status. Filters/pagination apply to the derived rows.
 */
export async function listDuesLedger(
  query: DuesLedgerQuery = {},
): Promise<ListResult<DuesLedgerRow>> {
  const page = Math.max(query.page ?? 1, 1);
  const limit = Math.min(Math.max(query.limit ?? 50, 1), 100);
  const status = query.status ?? "all";
  const now = new Date();

  const invoices = await fetchInvoicesWithClientContext();

  let rows: DuesLedgerRow[] = invoices.map((invoice) => {
    const balanceMinor = toMinorUnits(invoice.totalAmount) - toMinorUnits(invoice.paidAmount);
    return {
      invoiceId: invoice.invoiceId,
      invoiceNumber: invoice.invoiceNumber,
      subscriptionId: invoice.subscriptionId,
      memberId: invoice.memberId,
      memberName: invoice.memberName,
      memberEmail: invoice.memberEmail,
      tierId: invoice.tierId,
      tierName: invoice.tierName,
      amount: invoice.totalAmount,
      paid: invoice.paidAmount,
      balance: toAmountString(balanceMinor),
      issuedAt: invoice.issuedAt,
      dueDate: invoice.dueDate,
      status: deriveDuesStatus(invoice, now),
    };
  });

  if (status !== "all") {
    rows = rows.filter((row) => row.status === status);
  }

  const total = rows.length;
  const start = (page - 1) * limit;
  return { rows: rows.slice(start, start + limit), total };
}

/** Invoices with member/tier context and line items, for the invoices page. */
export async function listInvoicesForClient(
  query: InvoiceClientQuery = {},
): Promise<ListResult<InvoiceClientRow>> {
  const page = Math.max(query.page ?? 1, 1);
  const limit = Math.min(Math.max(query.limit ?? 50, 1), 100);
  const status = query.status ?? "all";
  const now = new Date();

  const invoices = await fetchInvoicesWithClientContext(query.userId);
  const itemsByInvoice = await fetchItemsForInvoices(invoices.map((invoice) => invoice.invoiceId));

  let rows: InvoiceClientRow[] = invoices.map((invoice) => {
    const balanceMinor = toMinorUnits(invoice.totalAmount) - toMinorUnits(invoice.paidAmount);
    const uiStatus: InvoiceClientRow["status"] =
      invoice.status === "PAID"
        ? "paid"
        : invoice.status === "VOID"
          ? "cancelled"
          : invoice.dueDate !== null && invoice.dueDate.getTime() < now.getTime()
            ? "overdue"
            : "sent";
    return {
      invoiceId: invoice.invoiceId,
      invoiceNumber: invoice.invoiceNumber,
      subscriptionId: invoice.subscriptionId,
      memberId: invoice.memberId,
      memberName: invoice.memberName,
      memberEmail: invoice.memberEmail,
      tierId: invoice.tierId,
      tierName: invoice.tierName,
      amount: invoice.totalAmount,
      paid: invoice.paidAmount,
      balance: toAmountString(balanceMinor),
      issuedAt: invoice.issuedAt,
      dueDate: invoice.dueDate,
      status: uiStatus,
      items: itemsByInvoice.get(invoice.invoiceId) ?? [],
    };
  });

  if (status !== "all") {
    rows = rows.filter((row) => row.status === status);
  }

  const total = rows.length;
  const start = (page - 1) * limit;
  return { rows: rows.slice(start, start + limit), total };
}

// ---------------------------------------------------------------------------
// Gateway status
// ---------------------------------------------------------------------------

/**
 * The deployment's configured payment gateway, from the same env seam C3's
 * adapters use (docs/adr/0015). Read-only: there is exactly one configured
 * gateway and it is managed by deployment config, not dashboard CRUD.
 * Only credential *presence* is exposed — never values.
 */
export function describeConfiguredGateway(): ConfiguredGatewayStatus {
  if (env.PAYMENT_GATEWAY === "stripe") {
    return {
      provider: "stripe",
      displayName: "Stripe",
      status: "active",
      description:
        "Card and payment-link processing through the Stripe adapter. " +
        "Checkout sessions are created server-side and confirmed by signed webhooks.",
      webhookEndpoint: "/api/v1/webhooks/stripe",
      secretKeyConfigured: Boolean(env.STRIPE_SECRET_KEY),
      webhookSecretConfigured: Boolean(env.STRIPE_WEBHOOK_SECRET),
    };
  }

  return {
    provider: "manual",
    displayName: "Manual (treasurer)",
    status: "active",
    description:
      "No external processor is configured. Payments are recorded manually against " +
      "issued invoices; invoice status follows the recorded payments.",
    webhookEndpoint: null,
    secretKeyConfigured: null,
    webhookSecretConfigured: null,
  };
}
