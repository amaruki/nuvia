"use client";

import { useCallback, useMemo, useState } from "react";
import { Archive, CheckCircle2, Trash2 } from "lucide-react";

import {
  DataTable,
  DataTablePagination,
  useDataTableState,
  type DataTableDensity,
} from "@/components/data-table";
import {
  ContentBulkBar,
  ContentTableToolbar,
  createCategoriesColumns,
  useCategoriesTableQuery,
  type ContentBulkAction,
} from "@/components/content/content-data-table";
import type { Category, CategoryStatus } from "@/types/category.types";

const BULK_ACTIONS: ContentBulkAction[] = [
  {
    key: "activate",
    label: "Activate",
    icon: CheckCircle2,
    confirmTitle: "Activate selected categories?",
    confirmDescription: (count) =>
      `Activate ${count} selected categor${count === 1 ? "y" : "ies"}? They become available for content assignment.`,
    confirmLabel: "Activate",
  },
  {
    key: "archive",
    label: "Archive",
    icon: Archive,
    confirmTitle: "Archive selected categories?",
    confirmDescription: (count) =>
      `Archive ${count} selected categor${count === 1 ? "y" : "ies"}? Existing assignments are kept but no new content can use them.`,
    confirmLabel: "Archive",
  },
  {
    key: "delete",
    label: "Delete",
    icon: Trash2,
    destructive: true,
    confirmTitle: "Delete selected categories?",
    confirmDescription: (count) =>
      `Delete ${count} selected categor${count === 1 ? "y" : "ies"}? This action cannot be undone.`,
    confirmLabel: "Delete",
  },
];

interface CategoriesListTabProps {
  onEdit: (category: Category) => void;
  onDuplicate: (category: Category) => void;
  onDelete: (category: Category) => void;
  onStatusChange: (category: Category, status: CategoryStatus) => void;
  bulkDelete: (ids: string[]) => Promise<void>;
  bulkUpdateStatus: (ids: string[], status: CategoryStatus) => Promise<void>;
  onSelectionChange: (ids: string[]) => void;
  /** Bumped after page-level mutations so the server view stays in sync. */
  version?: number;
}

export function CategoriesListTab({
  onEdit,
  onDuplicate,
  onDelete,
  onStatusChange,
  bulkDelete,
  bulkUpdateStatus,
  onSelectionChange,
  version = 0,
}: CategoriesListTabProps) {
  const { state, setSorting, setGlobalFilter, setPage, setPageSize } = useDataTableState();
  const [density, setDensity] = useState<DataTableDensity>("comfortable");
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});

  const { rows, total, totalPages, loading, error, refetch } = useCategoriesTableQuery({
    state,
    version,
  });

  const columns = useMemo(
    () => createCategoriesColumns({ onEdit, onDuplicate, onDelete, onStatusChange }),
    [onEdit, onDuplicate, onDelete, onStatusChange],
  );

  const selectedIds = useMemo(() => Object.keys(rowSelection), [rowSelection]);

  const clearSelection = useCallback(() => {
    setRowSelection({});
    onSelectionChange([]);
  }, [onSelectionChange]);

  const handleBulkAction = useCallback(
    async (key: string) => {
      if (selectedIds.length === 0) return;
      if (key === "activate") await bulkUpdateStatus(selectedIds, "active");
      else if (key === "archive") await bulkUpdateStatus(selectedIds, "archived");
      else if (key === "delete") await bulkDelete(selectedIds);
      clearSelection();
      refetch();
    },
    [selectedIds, bulkUpdateStatus, bulkDelete, clearSelection, refetch],
  );

  const safePage = Math.min(state.page, Math.max(totalPages, 1));

  return (
    <>
      <DataTable
        columns={columns}
        data={rows}
        getRowId={(row) => row.id}
        density={density}
        caption="Categories"
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
        emptyTitle="No categories found"
        emptyDescription="Try a different search, or add a new category."
        toolbar={(table) => (
          <ContentTableToolbar
            table={table}
            searchPlaceholder="Search categories..."
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
