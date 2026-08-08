"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FiltersControlProps } from "./types";

export function RangeInputs({ filters, onFiltersChange }: FiltersControlProps) {
  return (
    <>
      {/* Read Time Range Filter */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Read Time (minutes)</Label>
        <div className="grid grid-cols-2 gap-2">
          <Input
            type="number"
            placeholder="Min"
            value={filters.minReadTime || ""}
            onChange={(e) =>
              onFiltersChange({
                minReadTime: e.target.value ? parseInt(e.target.value) : undefined,
              })
            }
          />
          <Input
            type="number"
            placeholder="Max"
            value={filters.maxReadTime || ""}
            onChange={(e) =>
              onFiltersChange({
                maxReadTime: e.target.value ? parseInt(e.target.value) : undefined,
              })
            }
          />
        </div>
      </div>

      {/* Engagement Range Filter */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Engagement Score</Label>
        <div className="grid grid-cols-2 gap-2">
          <Input
            type="number"
            placeholder="Min"
            value={filters.minEngagement || ""}
            onChange={(e) =>
              onFiltersChange({
                minEngagement: e.target.value ? parseInt(e.target.value) : undefined,
              })
            }
          />
          <Input
            type="number"
            placeholder="Max"
            value={filters.maxEngagement || ""}
            onChange={(e) =>
              onFiltersChange({
                maxEngagement: e.target.value ? parseInt(e.target.value) : undefined,
              })
            }
          />
        </div>
      </div>
    </>
  );
}
