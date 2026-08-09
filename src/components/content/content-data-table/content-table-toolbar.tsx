"use client";

import type { Table } from "@tanstack/react-table";

import {
  DataTableDensityToggle,
  DataTableFacetedFilter,
  DataTableSearch,
  type DataTableDensity,
  type DataTableFacetedFilterOption,
} from "@/components/data-table";

export interface ContentTableToolbarProps<TData> {
  table: Table<TData>;
  searchPlaceholder: string;
  density: DataTableDensity;
  onDensityChange: (density: DataTableDensity) => void;
  /** Status facet; rendered only when the table has a "status" column. */
  statusOptions?: DataTableFacetedFilterOption[];
}

/**
 * Toolbar slot for the content tables: server-driven search, an optional
 * status facet (server applies it via ?status=), and the density toggle.
 */
export function ContentTableToolbar<TData>({
  table,
  searchPlaceholder,
  density,
  onDensityChange,
  statusOptions,
}: ContentTableToolbarProps<TData>) {
  const statusColumn = statusOptions ? table.getColumn("status") : undefined;

  return (
    <div className="flex w-full flex-wrap items-center justify-between gap-2">
      <DataTableSearch
        value={table.getState().globalFilter ?? ""}
        onValueChange={(value) => table.setGlobalFilter(value)}
        placeholder={searchPlaceholder}
        className="max-w-xs"
      />
      <div className="flex items-center gap-2">
        {statusColumn && statusOptions ? (
          <DataTableFacetedFilter column={statusColumn} title="Status" options={statusOptions} />
        ) : null}
        <DataTableDensityToggle density={density} onDensityChange={onDensityChange} />
      </div>
    </div>
  );
}
