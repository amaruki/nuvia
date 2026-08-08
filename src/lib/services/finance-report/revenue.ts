/**
 * Revenue + receivables aggregates — monthly revenue, revenue by tier,
 * outstanding receivables, and the combined dashboard summary call.
 */

import { asc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { membershipInvoice, membershipTier, membershipTransaction } from "@/db/schema";
import { toAmountString, toMinorUnits } from "@/lib/payments/gateway";
import { MAX_AGGREGATE_ROWS } from "./helpers";
import type {
  FinanceReportSummary,
  OutstandingSummary,
  RevenueByTierRow,
  RevenuePeriodRow,
} from "./types";

const periodKey = (date: Date): string =>
  `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;

function windowStart(months: number, now: Date): Date {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  start.setUTCMonth(start.getUTCMonth() - (months - 1));
  return start;
}

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
