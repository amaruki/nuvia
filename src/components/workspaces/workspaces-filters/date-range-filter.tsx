"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { DateRangeFilterProps } from "./types";

export function DateRangeFilter({ dateRange, onFieldChange }: DateRangeFilterProps) {
  return (
    <div className="space-y-3">
      <Label>Creation Date Range</Label>
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <Label htmlFor="start-date" className="text-sm text-muted-foreground">
            From
          </Label>
          <Input
            id="start-date"
            type="date"
            value={dateRange?.start ? dateRange.start.toISOString().split("T")[0] : ""}
            onChange={(e) => onFieldChange("start", e.target.value)}
          />
        </div>
        <div className="flex items-center justify-center h-10">
          <span className="text-muted-foreground">to</span>
        </div>
        <div className="flex-1">
          <Label htmlFor="end-date" className="text-sm text-muted-foreground">
            To
          </Label>
          <Input
            id="end-date"
            type="date"
            value={dateRange?.end ? dateRange.end.toISOString().split("T")[0] : ""}
            onChange={(e) => onFieldChange("end", e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
