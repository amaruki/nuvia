"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { MediaFilters } from "@/types/media";
import type { FilterControlProps } from "./types";

export function SizeRangeFilter({ filters, onFiltersChange }: FilterControlProps) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">File Size Range (MB)</Label>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="minSize" className="text-xs text-muted-foreground">
            Min Size
          </Label>
          <Input
            id="minSize"
            type="number"
            placeholder="0"
            value={filters.sizeRange?.min ? filters.sizeRange.min / 1024 / 1024 : ""}
            onChange={(e) => {
              const minSize = e.target.value ? parseInt(e.target.value) * 1024 * 1024 : undefined;
              const newRange = {
                min: minSize,
                max: filters.sizeRange?.max,
              } as MediaFilters["sizeRange"];
              onFiltersChange({ ...filters, sizeRange: newRange });
            }}
          />
        </div>
        <div>
          <Label htmlFor="maxSize" className="text-xs text-muted-foreground">
            Max Size
          </Label>
          <Input
            id="maxSize"
            type="number"
            placeholder="100"
            value={filters.sizeRange?.max ? filters.sizeRange.max / 1024 / 1024 : ""}
            onChange={(e) => {
              const maxSize = e.target.value ? parseInt(e.target.value) * 1024 * 1024 : undefined;
              const newRange = {
                min: filters.sizeRange?.min,
                max: maxSize,
              } as MediaFilters["sizeRange"];
              onFiltersChange({ ...filters, sizeRange: newRange });
            }}
          />
        </div>
      </div>
    </div>
  );
}
