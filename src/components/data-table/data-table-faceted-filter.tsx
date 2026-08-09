"use client";

import type { ComponentType } from "react";
import type { Column } from "@tanstack/react-table";
import { PlusCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";

export interface DataTableFacetedFilterOption {
  label: string;
  value: string;
  icon?: ComponentType<{ className?: string }>;
}

interface DataTableFacetedFilterProps<TData, TValue> {
  column?: Column<TData, TValue>;
  title?: string;
  options: DataTableFacetedFilterOption[];
}

/**
 * Multi-select column filter with per-option counts. Counts come from
 * column.getFacetedUniqueValues(): computed over the loaded rows in
 * client-side mode, or supplied by the server through the DataTable
 * getFacetedUniqueValues prop in manual mode.
 */
export function DataTableFacetedFilter<TData, TValue>({
  column,
  title,
  options,
}: DataTableFacetedFilterProps<TData, TValue>) {
  const facets = column?.getFacetedUniqueValues();
  const selectedValues = new Set((column?.getFilterValue() as string[] | undefined) ?? []);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 border-dashed">
          <PlusCircle className="size-4" aria-hidden="true" />
          {title}
          {selectedValues.size > 0 && (
            <>
              <Separator orientation="vertical" className="mx-2 h-4" />
              <span className="flex items-center gap-1">
                {selectedValues.size > 2 ? (
                  <Badge variant="secondary" className="rounded-sm px-1 font-normal">
                    {selectedValues.size} selected
                  </Badge>
                ) : (
                  options
                    .filter((option) => selectedValues.has(option.value))
                    .map((option) => (
                      <Badge
                        key={option.value}
                        variant="secondary"
                        className="rounded-sm px-1 font-normal"
                      >
                        {option.label}
                      </Badge>
                    ))
                )}
              </span>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2" align="start">
        <p className="text-sm font-medium">{title}</p>
        <div className="mt-2 space-y-0.5">
          {options.map((option) => {
            const checkboxId = `facet-${title}-${option.value}`;
            const selected = selectedValues.has(option.value);
            const count = facets?.get(option.value) ?? 0;
            const toggle = (checked: boolean) => {
              const next = new Set(selectedValues);
              if (checked) {
                next.add(option.value);
              } else {
                next.delete(option.value);
              }
              column?.setFilterValue(next.size > 0 ? [...next] : undefined);
            };
            return (
              <label
                key={option.value}
                htmlFor={checkboxId}
                className="hover:bg-accent flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm"
              >
                <Checkbox id={checkboxId} checked={selected} onCheckedChange={toggle} />
                {option.icon && (
                  <option.icon className="text-muted-foreground size-4" aria-hidden="true" />
                )}
                <span className="flex-1">{option.label}</span>
                {count > 0 && (
                  <span className="text-muted-foreground text-xs tabular-nums">{count}</span>
                )}
              </label>
            );
          })}
        </div>
        {selectedValues.size > 0 && (
          <>
            <Separator className="my-2" />
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-center"
              onClick={() => column?.setFilterValue(undefined)}
            >
              Clear filters
            </Button>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
