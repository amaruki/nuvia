"use client";

import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { CATEGORY_STATUSES, CATEGORY_STATUS_DISPLAY } from "@/types/category.types";
import type { StatusFilterProps } from "./types";

export function StatusFilter({ selected, onToggle }: StatusFilterProps) {
  return (
    <div className="space-y-3">
      <Label>Status</Label>
      <div className="flex flex-wrap gap-3">
        {CATEGORY_STATUSES.map((status) => (
          <div key={status} className="flex items-center space-x-2">
            <Checkbox
              id={`status-${status}`}
              checked={selected?.includes(status) || false}
              onCheckedChange={(checked: boolean) => onToggle(status, checked)}
            />
            <Label
              htmlFor={`status-${status}`}
              className="text-sm font-normal cursor-pointer flex items-center gap-2"
            >
              <Badge variant={CATEGORY_STATUS_DISPLAY[status].badgeVariant} className="text-xs">
                {CATEGORY_STATUS_DISPLAY[status].name}
              </Badge>
            </Label>
          </div>
        ))}
      </div>
    </div>
  );
}
