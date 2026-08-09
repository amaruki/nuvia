"use client";

import { useCallback, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { UserX } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DataTable,
  DataTableBulkBar,
  DataTableColumnHeader,
  DataTableFacetedFilter,
  DataTablePagination,
  DataTableSearch,
  useDataTableState,
} from "@/components/data-table";
import { DEMO_MEMBERS, type DemoMember } from "./demo-members";
import { applyColumnFilters, applySorting, matchesQuery } from "./demo-server";
import { initials, MemberRowActions } from "./member-row-actions";

const STATUS_BADGE: Record<DemoMember["status"], "secondary" | "outline" | "destructive"> = {
  ACTIVE: "secondary",
  INACTIVE: "outline",
  PENDING: "outline",
  SUSPENDED: "destructive",
};

const STATUS_OPTIONS = [
  { label: "Active", value: "ACTIVE" },
  { label: "Pending", value: "PENDING" },
  { label: "Inactive", value: "INACTIVE" },
  { label: "Suspended", value: "SUSPENDED" },
];

const CHAPTER_OPTIONS = ["Jakarta", "Bandung", "Surabaya", "Yogyakarta", "Denpasar"].map(
  (chapter) => ({ label: chapter, value: chapter }),
);

/**
 * Full-featured demo: URL-synced state via useDataTableState, faceted
 * filters with server-style counts, row actions, and a floating bulk bar.
 * This component plays the role of the server: it applies the URL-driven
 * filter, sort, and pagination to the demo dataset, exactly what a list
 * endpoint would do in production.
 */
export function MembersTableDemo() {
  const { state, setSorting, setGlobalFilter, setColumnFilters, setPage, setPageSize } =
    useDataTableState({
      filterParams: { status: "status", chapter: "chapter" },
    });
  const [selection, setSelection] = useState<Record<string, boolean>>({});
  const [selectedRows, setSelectedRows] = useState<DemoMember[]>([]);
  const [confirmSuspend, setConfirmSuspend] = useState(false);

  const columns = useMemo<ColumnDef<DemoMember>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="bg-muted text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-medium"
            >
              {initials(row.original.name)}
            </span>
            <span className="font-medium">{row.original.name}</span>
          </div>
        ),
      },
      {
        accessorKey: "email",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Email" />,
        cell: ({ row }) => <span className="text-muted-foreground">{row.original.email}</span>,
      },
      { accessorKey: "role", header: "Role" },
      {
        accessorKey: "chapter",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Chapter" />,
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge variant={STATUS_BADGE[row.original.status]}>
            {row.original.status.toLowerCase()}
          </Badge>
        ),
      },
      {
        accessorKey: "joinedAt",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Joined" />,
        cell: ({ row }) => format(row.original.joinedAt, "MMM d, yyyy"),
      },
      {
        id: "actions",
        cell: ({ row }) => <MemberRowActions member={row.original} />,
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [],
  );

  // Plays the role of the server: applies the URL-driven query, faceted
  // filters, and sort, then paginates. In production this is an API call.
  const processed = useMemo(() => {
    const filtered = applyColumnFilters(
      DEMO_MEMBERS.filter((member) => matchesQuery(member, state.globalFilter)),
      state.columnFilters,
    );
    return applySorting(filtered, state.sorting);
  }, [state.globalFilter, state.columnFilters, state.sorting]);

  // Facet counts behave like a server response: each column counts over rows
  // filtered by the global query and every other facet, never its own.
  const facetCounts = useCallback(
    (columnId: string) => {
      const filtered = applyColumnFilters(
        DEMO_MEMBERS.filter((member) => matchesQuery(member, state.globalFilter)),
        state.columnFilters,
        columnId,
      );
      const counts = new Map<string, number>();
      for (const member of filtered) {
        const value = String(member[columnId as keyof DemoMember]);
        counts.set(value, (counts.get(value) ?? 0) + 1);
      }
      return counts;
    },
    [state.globalFilter, state.columnFilters],
  );

  const pageCount = Math.max(1, Math.ceil(processed.length / state.pageSize));
  const safePage = Math.min(state.page, pageCount);
  const pageRows = processed.slice((safePage - 1) * state.pageSize, safePage * state.pageSize);

  return (
    <div className="space-y-3">
      <DataTable
        columns={columns}
        data={pageRows}
        caption="Member directory demo data"
        getRowId={(row) => row.id}
        manualSorting
        manualFiltering
        sorting={state.sorting}
        onSortingChange={(updater) =>
          setSorting(typeof updater === "function" ? updater(state.sorting) : updater)
        }
        globalFilter={state.globalFilter}
        onGlobalFilterChange={(updater) =>
          setGlobalFilter(typeof updater === "function" ? updater(state.globalFilter) : updater)
        }
        columnFilters={state.columnFilters}
        onColumnFiltersChange={(updater) =>
          setColumnFilters(typeof updater === "function" ? updater(state.columnFilters) : updater)
        }
        getFacetedUniqueValues={facetCounts}
        enableSelection
        rowSelection={selection}
        onRowSelectionChange={setSelection}
        onSelectionChange={setSelectedRows}
        onRowClick={(row) => toast(`Open member: ${row.name}`)}
        emptyTitle="No members match your filters"
        emptyDescription="Try a different search, or clear the status and chapter filters."
        toolbar={(table) => (
          <>
            <DataTableSearch
              value={state.globalFilter}
              onValueChange={setGlobalFilter}
              placeholder="Search members..."
            />
            <DataTableFacetedFilter
              column={table.getColumn("status")}
              title="Status"
              options={STATUS_OPTIONS}
            />
            <DataTableFacetedFilter
              column={table.getColumn("chapter")}
              title="Chapter"
              options={CHAPTER_OPTIONS}
            />
          </>
        )}
        pagination={
          <DataTablePagination
            page={safePage}
            pageCount={pageCount}
            total={processed.length}
            pageSize={state.pageSize}
            selectedCount={selectedRows.length}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        }
      />

      <DataTableBulkBar
        selectedCount={selectedRows.length}
        onClearSelection={() => setSelection({})}
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => toast(`Exported ${selectedRows.length} members (demo)`)}
            >
              Export
            </Button>
            <Button variant="destructive" size="sm" onClick={() => setConfirmSuspend(true)}>
              <UserX aria-hidden="true" />
              Suspend
            </Button>
          </>
        }
      />

      <AlertDialog open={confirmSuspend} onOpenChange={setConfirmSuspend}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Suspend {selectedRows.length} members?</AlertDialogTitle>
            <AlertDialogDescription>
              Their accounts lose sign-in access until reinstated. This mirrors the confirmation
              pattern production destructive actions use.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                toast(`Suspended ${selectedRows.length} members (demo)`);
                setSelection({});
              }}
            >
              Suspend
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
