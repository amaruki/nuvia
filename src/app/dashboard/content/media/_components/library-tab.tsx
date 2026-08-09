"use client";

import { useCallback, useMemo, useState } from "react";
import { Grid3X3, List, Search, Trash2 } from "lucide-react";

import {
  DataTable,
  DataTablePagination,
  useDataTableState,
  type DataTableDensity,
} from "@/components/data-table";
import {
  ContentBulkBar,
  ContentTableToolbar,
  createMediaColumns,
  useMediaTableQuery,
  type ContentBulkAction,
} from "@/components/content/content-data-table";
import { Button } from "@/components/ui/button";
import type { Media, MediaFilters } from "@/types/media";
import { MediaGrid } from "./media-grid";

const BULK_ACTIONS: ContentBulkAction[] = [
  {
    key: "delete",
    label: "Delete",
    icon: Trash2,
    destructive: true,
    confirmTitle: "Delete selected media?",
    confirmDescription: (count) =>
      `Delete ${count} selected file${count === 1 ? "" : "s"}? Stored bytes and manifest entries are removed. This action cannot be undone.`,
    confirmLabel: "Delete",
  },
];

interface LibraryTabProps {
  /** Legacy client list — only the grid view uses it. */
  media: Media[];
  selectedMedia: string[];
  toggleMediaSelection: (id: string) => void;
  filters: MediaFilters;
  updateFilters: (filters: Partial<MediaFilters>) => void;
  currentPage: number;
  totalPages: number;
  viewMode: "grid" | "table";
  setViewMode: (mode: "grid" | "table") => void;
  onViewDetails: (mediaItem: Media) => void;
  onEdit: (mediaItem: Media) => void;
  onDuplicate: (mediaItem: Media) => void;
  onDelete: (mediaItem: Media) => void;
  bulkDelete: (ids: string[]) => Promise<void>;
  onSelectionChange: (ids: string[]) => void;
  /** Bumped after page-level mutations so the server view stays in sync. */
  version?: number;
}

export function LibraryTab({
  media,
  selectedMedia,
  toggleMediaSelection,
  filters,
  updateFilters,
  currentPage,
  totalPages,
  viewMode,
  setViewMode,
  onViewDetails,
  onEdit,
  onDuplicate,
  onDelete,
  bulkDelete,
  onSelectionChange,
  version = 0,
}: LibraryTabProps) {
  return (
    <div className="space-y-4">
      {/* View Mode Toggle */}
      <div className="flex items-center gap-2">
        <Button
          variant={viewMode === "grid" ? "default" : "outline"}
          size="sm"
          onClick={() => setViewMode("grid")}
        >
          <Grid3X3 aria-hidden="true" />
          Grid
        </Button>
        <Button
          variant={viewMode === "table" ? "default" : "outline"}
          size="sm"
          onClick={() => setViewMode("table")}
        >
          <List aria-hidden="true" />
          Table
        </Button>
      </div>

      {viewMode === "grid" ? (
        <>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search
                aria-hidden="true"
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground"
              />
              <input
                type="text"
                placeholder="Search media..."
                className="border rounded-md py-2 pl-10 pr-4 text-sm"
                value={filters.search || ""}
                onChange={(event) => updateFilters({ search: event.target.value })}
              />
            </div>
          </div>

          <MediaGrid
            media={media}
            selectedMedia={selectedMedia}
            toggleMediaSelection={toggleMediaSelection}
            onViewDetails={onViewDetails}
            onEdit={onEdit}
            onDuplicate={onDuplicate}
            onDelete={onDelete}
          />

          {/* Legacy grid pagination. */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateFilters({ page: Math.max(1, currentPage - 1) })}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="text-muted-foreground text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateFilters({ page: Math.min(totalPages, currentPage + 1) })}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </>
      ) : (
        <MediaTablePanel
          enabled={viewMode === "table"}
          onViewDetails={onViewDetails}
          onEdit={onEdit}
          onDelete={onDelete}
          bulkDelete={bulkDelete}
          onSelectionChange={onSelectionChange}
          version={version}
        />
      )}
    </div>
  );
}

interface MediaTablePanelProps {
  enabled: boolean;
  onViewDetails: (mediaItem: Media) => void;
  onEdit: (mediaItem: Media) => void;
  onDelete: (mediaItem: Media) => void;
  bulkDelete: (ids: string[]) => Promise<void>;
  onSelectionChange: (ids: string[]) => void;
  version: number;
}

/**
 * Table view: server-driven DataTable (search/page/limit via ?search/?page/
 * ?limit), client-side sorting, bulk delete with AlertDialog confirmation.
 */
function MediaTablePanel({
  enabled,
  onViewDetails,
  onEdit,
  onDelete,
  bulkDelete,
  onSelectionChange,
  version,
}: MediaTablePanelProps) {
  const { state, setSorting, setGlobalFilter, setPage, setPageSize } = useDataTableState();
  const [density, setDensity] = useState<DataTableDensity>("comfortable");
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});

  const { rows, total, totalPages, loading, error, refetch } = useMediaTableQuery({
    state,
    version,
    enabled,
  });

  const columns = useMemo(
    () => createMediaColumns({ onViewDetails, onEdit, onDelete }),
    [onViewDetails, onEdit, onDelete],
  );

  const selectedIds = useMemo(() => Object.keys(rowSelection), [rowSelection]);

  const clearSelection = useCallback(() => {
    setRowSelection({});
    onSelectionChange([]);
  }, [onSelectionChange]);

  const handleBulkAction = useCallback(
    async (key: string) => {
      if (key !== "delete" || selectedIds.length === 0) return;
      await bulkDelete(selectedIds);
      clearSelection();
      refetch();
    },
    [selectedIds, bulkDelete, clearSelection, refetch],
  );

  const safePage = Math.min(state.page, Math.max(totalPages, 1));

  return (
    <>
      <DataTable
        columns={columns}
        data={rows}
        getRowId={(row) => row.id}
        density={density}
        caption="Media library"
        manualFiltering
        sorting={state.sorting}
        onSortingChange={(updater) =>
          setSorting(typeof updater === "function" ? updater(state.sorting) : updater)
        }
        globalFilter={state.globalFilter}
        onGlobalFilterChange={(updater) =>
          setGlobalFilter(typeof updater === "function" ? updater(state.globalFilter) : updater)
        }
        loading={loading}
        error={error}
        onRetry={refetch}
        enableSelection
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
        onSelectionChange={(selectedRows) => onSelectionChange(selectedRows.map((row) => row.id))}
        emptyTitle="No media found"
        emptyDescription="Try a different search, or upload new files."
        toolbar={(table) => (
          <ContentTableToolbar
            table={table}
            searchPlaceholder="Search media..."
            density={density}
            onDensityChange={setDensity}
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
