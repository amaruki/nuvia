import type { Invoice, InvoiceFilterOptions } from "@/types/finance";

/**
 * Client-side filtering of the hydrated invoices list: the report endpoint
 * serves one page and has no filter params, so the dashboard applies the
 * active filters in memory.
 */
export function applyInvoiceFilters(invoices: Invoice[], filters: InvoiceFilterOptions): Invoice[] {
  // Loop-invariant: lowercase the search needle once per pass, not per row.
  const needle = filters.search?.toLowerCase();
  return invoices.filter((invoice) => {
    if (filters.status?.length && !filters.status.includes(invoice.status)) return false;
    if (filters.client?.length && !filters.client.includes(invoice.clientName)) return false;
    if (filters.dateRange) {
      if (
        invoice.issueDate < filters.dateRange.start ||
        invoice.issueDate > filters.dateRange.end
      ) {
        return false;
      }
    }
    if (filters.amountRange) {
      if (invoice.totalAmount < filters.amountRange.min) return false;
      if (filters.amountRange.max > 0 && invoice.totalAmount > filters.amountRange.max)
        return false;
    }
    if (needle) {
      const haystack =
        `${invoice.invoiceNumber} ${invoice.clientName} ${invoice.clientEmail}`.toLowerCase();
      if (!haystack.includes(needle)) return false;
    }
    return true;
  });
}
