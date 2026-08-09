/**
 * Finance overview aggregates — revenue (all-time + monthly trend), open
 * receivables, and subscription counts. Reuses the finance-report revenue
 * and outstanding aggregates so the overview and the reports page never
 * disagree. Money stays numeric(10,2) strings summed in minor units
 * (ADR-0015 §5).
 */

import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { membershipSubscription, membershipTransaction } from "@/db/schema";
import { toAmountString, toMinorUnits } from "@/lib/payments/gateway";
import { getOutstandingSummary, getRevenueByPeriod } from "../finance-report.service";
import {
  ALL_TIME_TRANSACTION_ROWS,
  SUBSCRIPTION_SCAN_ROWS,
  changePercent,
  startOfUtcMonth,
} from "./helpers";
import type { FinanceOverviewStats } from "./types";

export async function getFinanceOverviewStats(opts?: {
  now?: Date;
}): Promise<FinanceOverviewStats> {
  const now = opts?.now ?? new Date();
  const monthStart = startOfUtcMonth(now);
  const lastMonthStart = new Date(
    Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth() - 1, 1),
  );

  const [periods, outstanding, completedTransactions, subscriptions] = await Promise.all([
    // Continuous two-month series: [previous month, current month].
    getRevenueByPeriod({ months: 2, now }),
    getOutstandingSummary({ now }),
    db
      .select({ amount: membershipTransaction.amount })
      .from(membershipTransaction)
      .where(eq(membershipTransaction.status, "COMPLETED"))
      .limit(ALL_TIME_TRANSACTION_ROWS),
    db
      .select({
        status: membershipSubscription.status,
        createdAt: membershipSubscription.createdAt,
        currentPeriodEnd: membershipSubscription.currentPeriodEnd,
      })
      .from(membershipSubscription)
      .limit(SUBSCRIPTION_SCAN_ROWS),
  ]);

  let totalRevenueMinor = 0;
  for (const tx of completedTransactions) {
    totalRevenueMinor += toMinorUnits(tx.amount);
  }

  const currentPeriod = periods[periods.length - 1];
  const previousPeriod = periods[0];
  const monthlyRevenue = currentPeriod?.revenue ?? "0.00";
  const previousMonthRevenue = periods.length > 1 ? (previousPeriod?.revenue ?? "0.00") : "0.00";

  let activeSubscriptions = 0;
  let newSubscriptionsThisMonth = 0;
  let newSubscriptionsLastMonth = 0;
  for (const subscription of subscriptions) {
    const periodCurrent =
      subscription.currentPeriodEnd === null ||
      subscription.currentPeriodEnd.getTime() > now.getTime();
    if (subscription.status === "ACTIVE" && periodCurrent) activeSubscriptions += 1;
    if (subscription.createdAt >= monthStart) newSubscriptionsThisMonth += 1;
    else if (subscription.createdAt >= lastMonthStart) newSubscriptionsLastMonth += 1;
  }

  return {
    totalRevenue: toAmountString(totalRevenueMinor),
    monthlyRevenue,
    previousMonthRevenue,
    monthlyRevenueChangePercent: changePercent(
      toMinorUnits(monthlyRevenue),
      toMinorUnits(previousMonthRevenue),
    ),
    pendingPayments: outstanding.outstandingAmount,
    overduePayments: outstanding.overdueAmount,
    activeSubscriptions,
    newSubscriptionsThisMonth,
    newSubscriptionsLastMonth,
  };
}
