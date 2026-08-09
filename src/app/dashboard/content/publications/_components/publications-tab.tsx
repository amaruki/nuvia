"use client";

import { useCallback, useMemo, useState } from "react";
import { Archive, CheckCircle2, Trash2 } from "lucide-react";

import {
  DataTable,
  DataTablePagination,
  useDataTableState,
  type DataTableDensity,
  type DataTableFacetedFilterOption,
} from "@/components/data-table";
import {
  ContentBulkBar,
  ContentTableToolbar,
  createPublicationsColumns,
  toPublication,
  useContentTableQuery,
  type ContentBulkAction,
} from "@/components/content/content-data-table";
import type { Publication, PublicationStatus } from "@/types/publication";
import { PUBLICATION_STATUS_DISPLAY } from "@/types/publication/display";

const STATUS_OPTIONS: DataTableFacetedFilterOption[] = (
  Object.keys(PUBLICATION_STATUS_DISPLAY) as PublicationStatus[]
).map((status) => ({ value: status, label: PUBLICATION_STATUS_DISPLAY[status].name }));

const BULK_ACTIONS: ContentBulkAction[] = [
  {
    key: "publish",
    label: "Publish",
    icon: CheckCircle2,
    confirmTitle: "Publish selected publications?",
    confirmDescription: (count) =>
      `Publish ${count} selected publication${count === 1 ? "" : "s"}? They become visible to readers immediately.`,
    confirmLabel: "Publish",
  },
  {
    key: "archive",
    label: "Archive",
    icon: Archive,
    confirmTitle: "Archive selected publications?",
    confirmDescription: (count) =>
      `Archive ${count} selected publication${count === 1 ? "" : "s"}? They will no longer be visible to readers.`,
    confirmLabel: "Archive",
  },
  {
    key: "delete",
    label: "Delete",
    icon: Trash2,
    destructive: true,
    confirmTitle: "Delete selected publications?",
    confirmDescription: (count) =>
      `Delete ${count} selected publication${count === 1 ? "" : "s"}? This action cannot be undone.`,
    confirmLabel: "Delete",
  },
];

interface PublicationsTabProps {
  onViewDetails: (publication: Publication) => void;
  onEdit: (publication: Publication) => void;
  onDelete: (publication: Publication) => void;
  onDuplicate: (publication: Publication) => void;
  onPublish: (publication: Publication) => void;
  onArchive: (publication: Publication) => void;
  bulkPublish: (ids: string[]) => Promise<void>;
  bulkArchive: (ids: string[]) => Promise<void>;
  bulkDelete: (ids: string[]) => Promise<void>;
  onSelectionChange: (ids: string[]) => void;
  /** Bumped after page-level mutations so the server view stays in sync. */
  version?: number;
}

export function PublicationsTab({
  onViewDetails,
  onEdit,
  onDelete,
  onDuplicate,
  onPublish,
  onArchive,
  bulkPublish,
  bulkArchive,
  bulkDelete,
  onSelectionChange,
  version = 0,
}: PublicationsTabProps) {
  const { state, setSorting, setGlobalFilter, setColumnFilters, setPage, setPageSize } =
    useDataTableState({ filterParams: { status: "status" } });
  const [density, setDensity] = useState<DataTableDensity>("comfortable");
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});

  const { rows, total, totalPages, loading, error, refetch } = useContentTableQuery({
    collection: "publications",
    state,
    hydrate: toPublication,
    sortableIds: ["title", "publishedAt"],
    version,
  });

  const columns = useMemo(
    () =>
      createPublicationsColumns({
        onViewDetails,
        onEdit,
        onDuplicate,
        onDelete,
        onPublish,
        onArchive,
      }),
    [onViewDetails, onEdit, onDuplicate, onDelete, onPublish, onArchive],
  );

  const selectedIds = useMemo(() => Object.keys(rowSelection), [rowSelection]);

  const clearSelection = useCallback(() => {
    setRowSelection({});
    onSelectionChange([]);
  }, [onSelectionChange]);

  const handleBulkAction = useCallback(
    async (key: string) => {
      if (selectedIds.length === 0) return;
      if (key === "publish") await bulkPublish(selectedIds);
      else if (key === "archive") await bulkArchive(selectedIds);
      else if (key === "delete") await bulkDelete(selectedIds);
      clearSelection();
      refetch();
    },
    [selectedIds, bulkPublish, bulkArchive, bulkDelete, clearSelection, refetch],
  );

  const safePage = Math.min(state.page, Math.max(totalPages, 1));

  return (
    <>
      <DataTable
        columns={columns}
        data={rows}
        getRowId={(row) => row.id}
        density={density}
        caption="Publications"
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
        getFacetedUniqueValues={() => new Map()}
        loading={loading}
        error={error}
        onRetry={refetch}
        enableSelection
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
        onSelectionChange={(selectedRows) => onSelectionChange(selectedRows.map((row) => row.id))}
        emptyTitle="No publications found"
        emptyDescription="Try a different search, or clear the status filter."
        toolbar={(table) => (
          <ContentTableToolbar
            table={table}
            searchPlaceholder="Search publications..."
            density={density}
            onDensityChange={setDensity}
            statusOptions={STATUS_OPTIONS}
          />
        )}
        pagination={
          <DataTablePagination
            page={safePage}
            pageCount={totalPages}
            total={total}
            pageSize={state.pageSize}
            loading={loading}
            selectedCount={selectedIds.length}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        }
      />

      <ContentBulkBar
        selectedCount={selectedIds.length}
        actions={BULK_ACTIONS}
        onAction={handleBulkAction}
        onClear={clearSelection}
      />
    </>
  );
}
