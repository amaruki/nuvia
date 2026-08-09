"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { CATEGORY_TYPES, CATEGORY_TYPE_DISPLAY } from "@/types/category.types";
import type { TypeFilterProps } from "./types";

export function TypeFilter({ selected, onToggle }: TypeFilterProps) {
  return (
    <div className="space-y-3">
      <Label>Type</Label>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {CATEGORY_TYPES.map((type) => (
          <div key={type} className="flex items-center space-x-2">
            <Checkbox
              id={`type-${type}`}
              checked={selected?.includes(type) || false}
              onCheckedChange={(checked: boolean) => onToggle(type, checked)}
            />
            <Label
              htmlFor={`type-${type}`}
              className="text-sm font-normal cursor-pointer flex items-center gap-2"
            >
              <span
                className="w-3 h-3 rounded"
                style={{
                  backgroundColor: CATEGORY_TYPE_DISPLAY[type].color,
                }}
              />
              {CATEGORY_TYPE_DISPLAY[type].name}
            </Label>
          </div>
        ))}
      </div>
    </div>
  );
}
