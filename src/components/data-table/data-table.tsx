"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import {
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type RowSelectionState,
  type SortingState,
  type Table as TableInstance,
} from "@tanstack/react-table";
import { AlertCircle, Inbox, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { type DataTableDensity } from "./data-table-density";
import { DataTableViewOptions } from "./data-table-view-options";
import { cn } from "@/lib/utils";

export interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  /** Renders skeleton rows instead of data. */
  loading?: boolean;
  /** Renders the error panel instead of data. */
  error?: string | null;
  onRetry?: () => void;
  /** Empty state content; defaults to a generic "no results" panel. */
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: ReactNode;
  emptyAction?: ReactNode;
  /** Screen-reader caption for the whole table. */
  caption?: string;
  /** Sorting. Uncontrolled when omitted. */
  sorting?: SortingState;
  onSortingChange?: Dispatch<SetStateAction<SortingState>>;
  /** True when the server applies sorting (URL search params pattern). */
  manualSorting?: boolean;
  /** Global text filter. Uncontrolled when omitted. */
  globalFilter?: string;
  onGlobalFilterChange?: Dispatch<SetStateAction<string>>;
  /** True when the server applies the filter. */
  manualFiltering?: boolean;
  /** Per-column filters (faceted filters). Uncontrolled when omitted. */
  columnFilters?: ColumnFiltersState;
  onColumnFiltersChange?: Dispatch<SetStateAction<ColumnFiltersState>>;
  /**
   * Server-provided faceted counts, keyed by column id. Only meaningful when
   * manualFiltering is true.
   */
  getFacetedUniqueValues?: (columnId: string) => Map<string | number, number>;
  getRowId?: (row: TData, index: number) => string;
  enableSelection?: boolean;
  /** Controlled selection state. Falls back to internal state when omitted. */
  rowSelection?: RowSelectionState;
  onRowSelectionChange?: Dispatch<SetStateAction<RowSelectionState>>;
  onSelectionChange?: (rows: TData[]) => void;
  onRowClick?: (row: TData) => void;
  /**
   * Toolbar slot (search input, filters, action buttons). Pass a function to
   * receive the table instance, e.g. to wire DataTableFacetedFilter columns.
   */
  toolbar?: ReactNode | ((table: TableInstance<TData>) => ReactNode);
  /** Pagination slot, usually <DataTablePagination />. */
  pagination?: ReactNode;
  skeletonRows?: number;
  /**
   * Row density (UI-09 convention 5). Defaults to "comfortable"; "compact"
   * tightens cell padding for power users. Pair with DataTableDensityToggle.
   */
  density?: DataTableDensity;
  className?: string;
}

const SKELETON_WIDTHS = ["max-w-32", "max-w-24", "max-w-40", "max-w-28"];

/**
 * Shared data-table layer (decision D12: TanStack Table v8 under shadcn
 * styling). Server-driven pagination is the norm in this app, so pagination
 * is a slot owned by the page; sorting, filtering, and selection can run
 * client-side or be delegated to the server via the manual* props.
 */
export function DataTable<TData, TValue>({
  columns,
  data,
  loading = false,
  error = null,
  onRetry,
  emptyTitle = "No results",
  emptyDescription,
  emptyIcon,
  emptyAction,
  caption,
  sorting: controlledSorting,
  onSortingChange,
  manualSorting = false,
  globalFilter: controlledGlobalFilter,
  onGlobalFilterChange,
  manualFiltering = false,
  columnFilters: controlledColumnFilters,
  onColumnFiltersChange,
  getFacetedUniqueValues,
  getRowId,
  enableSelection = false,
  rowSelection: controlledRowSelection,
  onRowSelectionChange,
  onSelectionChange,
  onRowClick,
  toolbar,
  pagination,
  skeletonRows = 5,
  density = "comfortable",
  className,
}: DataTableProps<TData, TValue>) {
  const [internalSorting, setInternalSorting] = useState<SortingState>([]);
  const [internalFilter, setInternalFilter] = useState("");
  const [internalColumnFilters, setInternalColumnFilters] = useState<ColumnFiltersState>([]);
  const [internalRowSelection, setInternalRowSelection] = useState<RowSelectionState>({});

  const sorting = controlledSorting ?? internalSorting;
  const columnFilters = controlledColumnFilters ?? internalColumnFilters;
  const globalFilter = controlledGlobalFilter ?? internalFilter;
  const rowSelection = controlledRowSelection ?? internalRowSelection;

  const allColumns = useMemo<ColumnDef<TData, TValue>[]>(() => {
    if (!enableSelection) {
      return columns;
    }
    const selectionColumn: ColumnDef<TData, TValue> = {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected()
              ? true
              : table.getIsSomePageRowsSelected()
                ? "indeterminate"
                : false
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(Boolean(value))}
          aria-label="Select all rows on this page"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(Boolean(value))}
          aria-label="Select row"
          onClick={(event) => event.stopPropagation()}
        />
      ),
      enableSorting: false,
      enableHiding: false,
    };
    return [selectionColumn, ...columns];
  }, [columns, enableSelection]);

  const table = useReactTable({
    data,
    columns: allColumns,
    state: { sorting, rowSelection, globalFilter, columnFilters },
    onSortingChange: onSortingChange ?? setInternalSorting,
    onRowSelectionChange: onRowSelectionChange ?? setInternalRowSelection,
    onGlobalFilterChange: onGlobalFilterChange ?? setInternalFilter,
    onColumnFiltersChange: onColumnFiltersChange ?? setInternalColumnFilters,
    manualSorting,
    manualFiltering,
    manualPagination: true,
    getRowId,
    getCoreRowModel: getCoreRowModel(),
    ...(!manualSorting && { getSortedRowModel: getSortedRowModel() }),
    ...(!manualFiltering && {
      getFilteredRowModel: getFilteredRowModel(),
      getFacetedRowModel: getFacetedRowModel<TData>(),
    }),
    getFacetedUniqueValues:
      manualFiltering && getFacetedUniqueValues
        ? (_table, columnId) => () => getFacetedUniqueValues(columnId)
        : undefined,
  });

  const tableRef = useRef(table);
  tableRef.current = table;

  useEffect(() => {
    if (!onSelectionChange) {
      return;
    }
    onSelectionChange(tableRef.current.getSelectedRowModel().rows.map((row) => row.original));
    // Fires only when the selection state itself changes. Do not add `data`
    // or `table` here: pages pass a fresh array slice per render, and
    // reacting to that would loop (setState -> rerender -> effect -> setState).
  }, [rowSelection, onSelectionChange]);

  const visibleLeafColumns = table.getVisibleLeafColumns();
  const showSkeleton = loading;
  const showError = !loading && Boolean(error);
  const rows = table.getRowModel().rows;
  const showEmpty = !loading && !error && rows.length === 0;

  return (
    <div data-density={density} className={cn("space-y-3", className)}>
      {toolbar && (
        <div className="flex flex-wrap items-center gap-2">
          {typeof toolbar === "function" ? toolbar(table) : toolbar}
          <DataTableViewOptions table={table} />
        </div>
      )}

      <div className="bg-card rounded-md border">
        <Table
          className={
            density === "compact" ? "[&_td]:py-1.5 [&_th]:py-1.5" : "[&_td]:py-3 [&_th]:py-3"
          }
        >
          {caption && <caption className="sr-only">{caption}</caption>}
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const sorted = header.column.getIsSorted();
                  return (
                    <TableHead
                      key={header.id}
                      aria-sort={
                        header.column.getCanSort()
                          ? sorted === "asc"
                            ? "ascending"
                            : sorted === "desc"
                              ? "descending"
                              : "none"
                          : undefined
                      }
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {showSkeleton ? (
              Array.from({ length: skeletonRows }).map((_, rowIndex) => (
                <TableRow key={`skeleton-${rowIndex}`}>
                  {visibleLeafColumns.map((column, cellIndex) => (
                    <TableCell key={column.id}>
                      <Skeleton
                        className={cn(
                          "h-4 w-full",
                          SKELETON_WIDTHS[cellIndex % SKELETON_WIDTHS.length],
                        )}
                      />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : showError ? (
              <TableRow>
                <TableCell colSpan={visibleLeafColumns.length}>
                  <div className="flex flex-col items-center justify-center gap-2 p-8 text-center">
                    <AlertCircle className="text-destructive size-8" aria-hidden="true" />
                    <h3 className="font-medium">Failed to load data</h3>
                    {error && <p className="text-muted-foreground text-sm">{error}</p>}
                    {onRetry && (
                      <Button variant="outline" size="sm" onClick={onRetry} className="mt-2">
                        <RefreshCw aria-hidden="true" />
                        Try again
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : showEmpty ? (
              <TableRow>
                <TableCell colSpan={visibleLeafColumns.length}>
                  <EmptyState
                    title={emptyTitle}
                    description={emptyDescription}
                    icon={
                      emptyIcon ?? (
                        <Inbox className="text-muted-foreground size-8" aria-hidden="true" />
                      )
                    }
                    actions={emptyAction}
                  />
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() ? "selected" : undefined}
                  onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                  className={cn(onRowClick && "cursor-pointer")}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {pagination}
    </div>
  );
}
