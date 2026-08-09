import type { ColumnFiltersState, SortingState } from "@tanstack/react-table";

import type { DemoMember } from "./demo-members";

/**
 * Local stand-in for the list endpoint. In production these three steps run
 * in the API route or a database query; the demo applies the same URL-driven
 * query, faceted filters, and sort over the in-memory dataset.
 */

export function matchesQuery(member: DemoMember, query: string): boolean {
  if (!query) {
    return true;
  }
  const needle = query.trim().toLowerCase();
  return [member.name, member.email, member.role, member.chapter]
    .join(" ")
    .toLowerCase()
    .includes(needle);
}

export function applyColumnFilters(
  rows: DemoMember[],
  filters: ColumnFiltersState,
  excludeColumnId?: string,
): DemoMember[] {
  let result = rows;
  for (const filter of filters) {
    if (filter.id === excludeColumnId || !Array.isArray(filter.value)) {
      continue;
    }
    const values = new Set(filter.value.map(String));
    result = result.filter((member) => values.has(String(member[filter.id as keyof DemoMember])));
  }
  return result;
}

export function applySorting(rows: DemoMember[], sorting: SortingState): DemoMember[] {
  if (sorting.length === 0) {
    return rows;
  }
  const { id, desc } = sorting[0];
  return [...rows].sort((leftRow, rightRow) => {
    const left = leftRow[id as keyof DemoMember];
    const right = rightRow[id as keyof DemoMember];
    const comparison =
      left instanceof Date && right instanceof Date
        ? left.getTime() - right.getTime()
        : String(left).localeCompare(String(right));
    return desc ? -comparison : comparison;
  });
}
