"use client";

import { format } from "date-fns";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import type { AwardProgram } from "@/types/award.types";
import {
  CATEGORY_BADGE_CLASSES,
  STATUS_BADGE_VARIANTS,
  formatDateRange,
  formatEnumLabel,
} from "./program-utils";

/**
 * Award program columns for the DataTable. Sorting is fixed server-side
 * (name asc), so every column disables sorting; status/category ids double
 * as the facet filter column ids.
 */
export const programColumns: ColumnDef<AwardProgram>[] = [
  {
    id: "name",
    accessorKey: "name",
    header: "Program",
    enableSorting: false,
    cell: ({ row }) => (
      <div className="max-w-xs">
        <div className="font-medium">{row.original.name}</div>
        {row.original.description && (
          <div className="truncate text-sm text-muted-foreground">{row.original.description}</div>
        )}
      </div>
    ),
  },
  {
    accessorKey: "category",
    header: "Category",
    enableSorting: false,
    cell: ({ row }) => (
      <Badge variant="outline" className={CATEGORY_BADGE_CLASSES[row.original.category]}>
        {formatEnumLabel(row.original.category)}
      </Badge>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    enableSorting: false,
    cell: ({ row }) => (
      <Badge variant={STATUS_BADGE_VARIANTS[row.original.status]}>
        {formatEnumLabel(row.original.status)}
      </Badge>
    ),
  },
  {
    accessorKey: "nominationCount",
    header: () => <span className="block text-right">Nominations</span>,
    enableSorting: false,
    cell: ({ getValue }) => <span className="block text-right">{getValue<number>()}</span>,
  },
  {
    id: "nominationWindow",
    header: "Nomination Window",
    enableSorting: false,
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">{formatDateRange(row.original)}</span>
    ),
  },
  {
    id: "awardDate",
    header: "Award Date",
    enableSorting: false,
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {row.original.awardDate ? format(row.original.awardDate, "MMM d, yyyy") : "—"}
      </span>
    ),
  },
];
