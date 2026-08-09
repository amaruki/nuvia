"use client";

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PAGE_SIZES = ["10", "20", "50", "100"] as const;

export interface DataTablePaginationProps {
  /** 1-based current page. */
  page: number;
  pageCount: number;
  /** Total row count across all pages. */
  total: number;
  pageSize: number;
  loading?: boolean;
  selectedCount?: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
}

/**
 * Server-driven pagination footer. The page owns page/pageCount/total
 * (usually from URL search params) and passes them down; this component
 * only renders controls and reports intent.
 */
export function DataTablePagination({
  page,
  pageCount,
  total,
  pageSize,
  loading = false,
  selectedCount = 0,
  onPageChange,
  onPageSizeChange,
}: DataTablePaginationProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 px-1">
      <p className="text-muted-foreground text-sm" aria-live="polite">
        {selectedCount > 0 ? `${selectedCount} of ` : ""}
        {total} row{total === 1 ? "" : "s"}
      </p>
      <div className="flex flex-wrap items-center gap-6">
        {onPageSizeChange && (
          <div className="flex items-center gap-2">
            <label htmlFor="data-table-page-size" className="text-muted-foreground text-sm">
              Rows per page
            </label>
            <Select
              value={String(pageSize)}
              onValueChange={(value) => onPageSizeChange(Number(value))}
            >
              <SelectTrigger id="data-table-page-size" className="h-8 w-[70px]">
                <SelectValue placeholder={pageSize} />
              </SelectTrigger>
              <SelectContent side="top">
                {PAGE_SIZES.map((size) => (
                  <SelectItem key={size} value={size}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          <span>
            Page {page} of {Math.max(pageCount, 1)}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={() => onPageChange(1)}
              disabled={loading || page <= 1}
              aria-label="First page"
            >
              <ChevronsLeft aria-hidden="true" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={() => onPageChange(page - 1)}
              disabled={loading || page <= 1}
              aria-label="Previous page"
            >
              <ChevronLeft aria-hidden="true" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={() => onPageChange(page + 1)}
              disabled={loading || page >= pageCount}
              aria-label="Next page"
            >
              <ChevronRight aria-hidden="true" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={() => onPageChange(pageCount)}
              disabled={loading || page >= pageCount}
              aria-label="Last page"
            >
              <ChevronsRight aria-hidden="true" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
