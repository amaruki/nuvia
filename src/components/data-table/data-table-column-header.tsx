"use client";

import type { HTMLAttributes } from "react";
import type { Column } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DataTableColumnHeaderProps<TData, TValue> extends HTMLAttributes<HTMLButtonElement> {
  column: Column<TData, TValue>;
  title: string;
}

/**
 * Sortable header content. Renders the toggle button only; the wrapping
 * <th> in <DataTable> carries aria-sort so screen readers announce state.
 */
export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  if (!column.getCanSort()) {
    return <span className={cn("px-2", className)}>{title}</span>;
  }

  const sorted = column.getIsSorted();

  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn("-ml-3 h-8 data-[state=open]:bg-accent", className)}
      onClick={() => column.toggleSorting(sorted === "asc")}
      aria-label={`Sort by ${title}`}
    >
      <span>{title}</span>
      {sorted === "asc" ? (
        <ArrowUp className="ml-2 size-4" aria-hidden="true" />
      ) : sorted === "desc" ? (
        <ArrowDown className="ml-2 size-4" aria-hidden="true" />
      ) : (
        <ArrowUpDown className="text-muted-foreground ml-2 size-4" aria-hidden="true" />
      )}
    </Button>
  );
}
