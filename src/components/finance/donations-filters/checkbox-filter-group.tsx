"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { CheckboxFilterGroupProps } from "./types";

export function CheckboxFilterGroup({
  label,
  idPrefix,
  options,
  selected,
  onToggle,
}: CheckboxFilterGroupProps) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <div key={option.value} className="flex items-center space-x-2">
            <Checkbox
              id={`${idPrefix}-${option.value}`}
              checked={selected?.includes(option.value) || false}
              onCheckedChange={(checked) => onToggle(option.value, checked as boolean)}
            />
            <Label htmlFor={`${idPrefix}-${option.value}`} className="text-sm">
              {option.label}
            </Label>
          </div>
        ))}
      </div>
    </div>
  );
}
