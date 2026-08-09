import type { DueFilterOptions, MemberDue } from "@/types/finance";

/**
 * Client-side filtering of the hydrated dues list: the report endpoint
 * serves one page and has no filter params, so the dashboard applies the
 * active filters in memory.
 */
export function applyDueFilters(dues: MemberDue[], filters: DueFilterOptions): MemberDue[] {
  // Loop-invariant: lowercase the search needle once per pass, not per row.
  const needle = filters.search?.toLowerCase();
  return dues.filter((due) => {
    if (filters.status?.length && !filters.status.includes(due.status)) return false;
    if (filters.tier?.length && !filters.tier.includes(due.membershipTier)) return false;
    if (filters.dateRange) {
      if (due.dueDate < filters.dateRange.start || due.dueDate > filters.dateRange.end) {
        return false;
      }
    }
    if (filters.amountRange) {
      if (due.dueAmount < filters.amountRange.min) return false;
      if (filters.amountRange.max > 0 && due.dueAmount > filters.amountRange.max) return false;
    }
    if (needle) {
      const haystack = `${due.memberName} ${due.memberEmail} ${due.membershipTier}`.toLowerCase();
      if (!haystack.includes(needle)) return false;
    }
    return true;
  });
}
