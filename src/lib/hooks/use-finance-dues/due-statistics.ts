import type { DueStatistics, MemberDue } from "@/types/finance";

/**
 * Statistics are derived client-side from the filtered due rows — never
 * invented and never fetched from a separate endpoint.
 */
export function buildDueStatistics(dues: MemberDue[]): DueStatistics {
  const totalAmount = dues.reduce((sum, due) => sum + due.dueAmount, 0);
  const collectedAmount = dues.reduce((sum, due) => sum + due.paidAmount, 0);
  const open = dues.filter((due) => due.status === "pending" || due.status === "partial");
  const overdue = dues.filter((due) => due.status === "overdue");
  const inThirtyDays = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const byMonth = new Map<string, { amount: number; collected: number }>();
  for (const due of dues) {
    const key = `${due.dueDate.getFullYear()}-${String(due.dueDate.getMonth() + 1).padStart(2, "0")}`;
    const bucket = byMonth.get(key) ?? { amount: 0, collected: 0 };
    bucket.amount += due.dueAmount;
    bucket.collected += due.paidAmount;
    byMonth.set(key, bucket);
  }

  const byTier = new Map<string, { count: number; amount: number; collected: number }>();
  for (const due of dues) {
    const bucket = byTier.get(due.membershipTier) ?? { count: 0, amount: 0, collected: 0 };
    bucket.count += 1;
    bucket.amount += due.dueAmount;
    bucket.collected += due.paidAmount;
    byTier.set(due.membershipTier, bucket);
  }

  return {
    totalDues: dues.length,
    totalAmount,
    collectedAmount,
    pendingAmount: open.reduce((sum, due) => sum + due.balanceAmount, 0),
    overdueAmount: overdue.reduce((sum, due) => sum + due.balanceAmount, 0),
    collectionRate: totalAmount > 0 ? Math.round((collectedAmount / totalAmount) * 100) : 0,
    overdueCount: overdue.length,
    upcomingDues: open.filter((due) => due.dueDate <= inThirtyDays).length,
    monthlyTrend: Array.from(byMonth.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, bucket]) => ({ month, amount: bucket.amount, collected: bucket.collected })),
    tierBreakdown: Array.from(byTier.entries()).map(([tier, bucket]) => ({
      tier,
      count: bucket.count,
      amount: bucket.amount,
      collected: bucket.collected,
    })),
  };
}
