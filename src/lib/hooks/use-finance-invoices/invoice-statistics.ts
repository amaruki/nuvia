import type { Invoice, InvoiceStatistics } from "@/types/finance";

/**
 * Statistics are derived client-side from the filtered invoice rows — never
 * invented and never fetched from a separate endpoint.
 */
export function buildInvoiceStatistics(invoices: Invoice[]): InvoiceStatistics {
  const totalAmount = invoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0);
  const paidAmount = invoices.reduce((sum, invoice) => sum + (invoice.paidAmount ?? 0), 0);
  const open = invoices.filter((invoice) => invoice.status === "sent");
  const overdue = invoices.filter((invoice) => invoice.status === "overdue");
  const inThirtyDays = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const byMonth = new Map<string, { amount: number; collected: number }>();
  for (const invoice of invoices) {
    const key = `${invoice.issueDate.getFullYear()}-${String(invoice.issueDate.getMonth() + 1).padStart(2, "0")}`;
    const bucket = byMonth.get(key) ?? { amount: 0, collected: 0 };
    bucket.amount += invoice.totalAmount;
    bucket.collected += invoice.paidAmount ?? 0;
    byMonth.set(key, bucket);
  }

  const byClient = new Map<
    string,
    { clientName: string; invoiceCount: number; totalAmount: number; paidAmount: number }
  >();
  for (const invoice of invoices) {
    const bucket = byClient.get(invoice.clientId) ?? {
      clientName: invoice.clientName,
      invoiceCount: 0,
      totalAmount: 0,
      paidAmount: 0,
    };
    bucket.invoiceCount += 1;
    bucket.totalAmount += invoice.totalAmount;
    bucket.paidAmount += invoice.paidAmount ?? 0;
    byClient.set(invoice.clientId, bucket);
  }

  return {
    totalInvoices: invoices.length,
    totalAmount,
    paidAmount,
    pendingAmount: open.reduce(
      (sum, invoice) => sum + invoice.totalAmount - (invoice.paidAmount ?? 0),
      0,
    ),
    overdueAmount: overdue.reduce(
      (sum, invoice) => sum + invoice.totalAmount - (invoice.paidAmount ?? 0),
      0,
    ),
    collectionRate: totalAmount > 0 ? Math.round((paidAmount / totalAmount) * 100) : 0,
    overdueCount: overdue.length,
    upcomingInvoices: open.filter((invoice) => invoice.dueDate <= inThirtyDays).length,
    monthlyTrend: Array.from(byMonth.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, bucket]) => ({ month, amount: bucket.amount, collected: bucket.collected })),
    clientBreakdown: Array.from(byClient.entries()).map(([clientId, bucket]) => ({
      clientId,
      clientName: bucket.clientName,
      invoiceCount: bucket.invoiceCount,
      totalAmount: bucket.totalAmount,
      paidAmount: bucket.paidAmount,
    })),
  };
}
