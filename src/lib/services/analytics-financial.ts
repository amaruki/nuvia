/**
 * Financial analytics aggregates (UI-23) — monthly revenue, invoice status
 * breakdown, and the dues-vs-donations picture.
 *
 * Revenue reuses the finance-report `getRevenueByPeriod` aggregate so this
 * page and the finance reports always agree; money stays numeric(10,2)
 * string amounts summed in minor units (ADR-0015 §5). Donations are not
 * split out with invented numbers: the schema has no donation tables, so
 * this returns the finance service's honest capability report instead
 * (see src/lib/services/finance/member-donations.ts).
 */

import { and, eq, gte } from "drizzle-orm";
import { db } from "@/db/client";
import { membershipInvoice, membershipTransaction } from "@/db/schema";
import { toAmountString, toMinorUnits } from "@/lib/payments/gateway";
import { getDonationCapability, type DonationCapability } from "./finance";
import {
  getOutstandingSummary,
  getRevenueByPeriod,
  type OutstandingSummary,
  type RevenuePeriodRow,
} from "./finance-report.service";

const DEFAULT_WINDOW_MONTHS = 12;
const INVOICE_SCAN_ROWS = 10_000;
const TRANSACTION_SCAN_ROWS = 100_000;

export interface InvoiceStatusCount {
  status: string;
  count: number;
}

export interface DuesDonationSplit {
  /** Sum of COMPLETED transactions (dues) in the window, string-mode. */
  dues: string;
  /** Number of COMPLETED transactions behind the dues figure. */
  duesTransactionCount: number;
  /**
   * The honest donation capability — `available` is a literal false until a
   * donation schema exists, so no donation total is ever invented.
   */
  donations: DonationCapability;
}

export interface FinancialAnalytics {
  /** Continuous month series of revenue, oldest first. */
  revenueByPeriod: RevenuePeriodRow[];
  invoiceStatuses: InvoiceStatusCount[];
  outstanding: OutstandingSummary;
  split: DuesDonationSplit;
}

export async function getFinancialAnalytics(opts?: {
  months?: number;
  now?: Date;
}): Promise<FinancialAnalytics> {
  const months = Math.min(Math.max(opts?.months ?? DEFAULT_WINDOW_MONTHS, 1), 36);
  const now = opts?.now ?? new Date();
  const windowStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  windowStart.setUTCMonth(windowStart.getUTCMonth() - (months - 1));

  const [revenueByPeriod, outstanding, invoices, completedTransactions] = await Promise.all([
    getRevenueByPeriod({ months, now }),
    getOutstandingSummary({ now }),
    db
      .select({ status: membershipInvoice.status })
      .from(membershipInvoice)
      .limit(INVOICE_SCAN_ROWS),
    db
      .select({ amount: membershipTransaction.amount })
      .from(membershipTransaction)
      .where(
        and(
          eq(membershipTransaction.status, "COMPLETED"),
          gte(membershipTransaction.createdAt, windowStart),
        ),
      )
      .limit(TRANSACTION_SCAN_ROWS),
  ]);

  const statusCounts = new Map<string, number>();
  for (const invoice of invoices) {
    statusCounts.set(invoice.status, (statusCounts.get(invoice.status) ?? 0) + 1);
  }
  const invoiceStatuses: InvoiceStatusCount[] = [...statusCounts.entries()]
    .map(([status, count]) => ({ status, count }))
    .sort((a, b) => b.count - a.count);

  let duesMinor = 0;
  for (const tx of completedTransactions) {
    duesMinor += toMinorUnits(tx.amount);
  }

  return {
    revenueByPeriod,
    invoiceStatuses,
    outstanding,
    split: {
      dues: toAmountString(duesMinor),
      duesTransactionCount: completedTransactions.length,
      donations: getDonationCapability(),
    },
  };
}
