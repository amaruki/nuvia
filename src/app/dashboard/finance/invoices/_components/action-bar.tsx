"use client";

import { RefreshCw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { InvoiceStatistics } from "@/types/finance";

interface ActionBarProps {
  /** Total invoices across all pages (from the report meta). */
  totalItems: number;
  statistics: InvoiceStatistics | null;
  onRefresh: () => void;
}

export function ActionBar({ totalItems, statistics, onRefresh }: ActionBarProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
        <Badge variant="outline" className="text-sm">
          {totalItems} invoices total
        </Badge>
        {statistics && (
          <Badge variant="secondary" className="text-sm">
            {statistics.overdueCount} overdue
          </Badge>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" onClick={onRefresh} className="flex-1 sm:flex-none">
          <RefreshCw className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">Refresh</span>
        </Button>
      </div>
    </div>
  );
}
