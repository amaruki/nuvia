"use client";

import { Plus, RefreshCw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface DonationsActionBarProps {
  /** Total donations across all pages (from the list meta). */
  totalItems: number;
  onRecord: () => void;
  onRefresh: () => void;
}

export function DonationsActionBar({ totalItems, onRecord, onRefresh }: DonationsActionBarProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
        <Badge variant="outline" className="text-sm">
          {totalItems} donations total
        </Badge>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" onClick={onRefresh} className="flex-1 sm:flex-none">
          <RefreshCw className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">Refresh</span>
        </Button>
        <Button size="sm" onClick={onRecord} className="flex-1 sm:flex-none">
          <Plus className="mr-2 h-4 w-4" />
          Record Donation
        </Button>
      </div>
    </div>
  );
}
