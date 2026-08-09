"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { CATEGORY_SCOPES, CATEGORY_SCOPE_DISPLAY } from "@/types/category.types";
import type { ScopeFilterProps } from "./types";

export function ScopeFilter({ selected, onToggle }: ScopeFilterProps) {
  return (
    <div className="space-y-3">
      <Label>Scope</Label>
      <div className="flex flex-wrap gap-3">
        {CATEGORY_SCOPES.map((scope) => (
          <div key={scope} className="flex items-center space-x-2">
            <Checkbox
              id={`scope-${scope}`}
              checked={selected?.includes(scope) || false}
              onCheckedChange={(checked: boolean) => onToggle(scope, checked)}
            />
            <Label
              htmlFor={`scope-${scope}`}
              className="text-sm font-normal cursor-pointer flex items-center gap-2"
            >
              <span
                className="w-3 h-3 rounded"
                style={{
                  backgroundColor: CATEGORY_SCOPE_DISPLAY[scope].color,
                }}
              />
              {CATEGORY_SCOPE_DISPLAY[scope].name}
            </Label>
          </div>
        ))}
      </div>
    </div>
  );
}
