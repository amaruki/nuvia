// Shared data-table layer. NOTE: never add "use server" to this barrel;
// it exports client components and would break module resolution (UI-37).
export { DataTable, type DataTableProps } from "./data-table";
export { DataTableColumnHeader } from "./data-table-column-header";
export { DataTableBulkBar } from "./data-table-bulk-bar";
export {
  DataTableDensityToggle,
  TABLE_DENSITY_STORAGE_KEY,
  type DataTableDensity,
  type DataTableDensityToggleProps,
} from "./data-table-density";
export {
  DataTableFacetedFilter,
  type DataTableFacetedFilterOption,
} from "./data-table-faceted-filter";
export { DataTablePagination, type DataTablePaginationProps } from "./data-table-pagination";
export { DataTableSearch } from "./data-table-search";
export { DataTableViewOptions } from "./data-table-view-options";
export { useDataTableState, type DataTableUrlState } from "@/hooks/use-data-table-state";
