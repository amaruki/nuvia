"use client";

import { Archive, CheckCircle2, Copy, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";

import { DataTableColumnHeader } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Category, CategoryStatus } from "@/types/category.types";
import { CATEGORY_STATUS_DISPLAY, CATEGORY_TYPE_DISPLAY } from "@/types/category-display.types";

import { DateCell, TruncateText } from "./cells";

export interface CategoriesColumnHandlers {
  onEdit: (category: Category) => void;
  onDuplicate: (category: Category) => void;
  onDelete: (category: Category) => void;
  onStatusChange: (category: Category, status: CategoryStatus) => void;
}

/**
 * Categories columns. The list endpoint has no sortBy contract, so sorting
 * runs client-side over the loaded page (manualSorting stays off).
 */
export function createCategoriesColumns(handlers: CategoriesColumnHandlers): ColumnDef<Category>[] {
  return [
    {
      id: "name",
      accessorKey: "name",
      enableSorting: true,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Category" />,
      cell: ({ row }) => (
        <div className="flex min-w-0 items-center gap-2">
          <span
            aria-hidden="true"
            className="size-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: row.original.color || "#94a3b8" }}
          />
          <div className="min-w-0">
            <TruncateText value={row.original.name} className="font-medium" />
            {row.original.description ? (
              <TruncateText
                value={row.original.description}
                className="text-muted-foreground text-xs"
              />
            ) : null}
          </div>
        </div>
      ),
    },
    {
      id: "type",
      accessorKey: "type",
      enableSorting: false,
      header: "Type",
      cell: ({ row }) => (
        <Badge variant="outline">{CATEGORY_TYPE_DISPLAY[row.original.type].name}</Badge>
      ),
    },
    {
      id: "contentCount",
      accessorFn: (row) => row.contentCount ?? 0,
      enableSorting: false,
      header: () => <div className="text-right">Items</div>,
      cell: ({ row }) => (
        <div className="text-muted-foreground text-sm tabular-nums">
          {(row.original.contentCount ?? 0).toLocaleString()}
        </div>
      ),
    },
    {
      id: "status",
      accessorKey: "status",
      enableSorting: false,
      header: "Status",
      cell: ({ row }) => {
        const display = CATEGORY_STATUS_DISPLAY[row.original.status];
        return <Badge variant={display.badgeVariant}>{display.name}</Badge>;
      },
    },
    {
      id: "createdAt",
      accessorKey: "createdAt",
      enableSorting: true,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Created" />,
      cell: ({ row }) => <DateCell value={row.original.createdAt} />,
    },
    {
      id: "actions",
      enableSorting: false,
      enableHiding: false,
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => (
        <CategoryRowActions
          category={row.original}
          onEdit={handlers.onEdit}
          onDuplicate={handlers.onDuplicate}
          onDelete={handlers.onDelete}
          onStatusChange={handlers.onStatusChange}
        />
      ),
    },
  ];
}

interface CategoryRowActionsProps extends CategoriesColumnHandlers {
  category: Category;
}

function CategoryRowActions({
  category,
  onEdit,
  onDuplicate,
  onDelete,
  onStatusChange,
}: CategoryRowActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8">
          <span className="sr-only">Open actions for {category.name}</span>
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onClick={() => onEdit(category)} className="flex items-center gap-2">
          <Pencil className="size-4" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onDuplicate(category)} className="flex items-center gap-2">
          <Copy className="size-4" />
          Duplicate
        </DropdownMenuItem>
        {category.status === "active" ? (
          <DropdownMenuItem
            onClick={() => onStatusChange(category, "archived")}
            className="flex items-center gap-2"
          >
            <Archive className="size-4" />
            Archive
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem
            onClick={() => onStatusChange(category, "active")}
            className="flex items-center gap-2"
          >
            <CheckCircle2 className="size-4" />
            Activate
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => onDelete(category)}
          className="flex items-center gap-2 text-red-600 focus:text-red-600"
        >
          <Trash2 className="size-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
