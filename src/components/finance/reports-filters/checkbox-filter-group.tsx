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
    <div className="space-y-3">
      <Label>{label}</Label>
      <div className="grid grid-cols-2 gap-2">
        {options.map((option) => (
          <div key={option.value} className="flex items-center space-x-2">
            <Checkbox
              id={`${idPrefix}-${option.value}`}
              checked={selected?.includes(option.value) || false}
              onCheckedChange={(checked) => onToggle(option.value, checked as boolean)}
            />
            <Label
              htmlFor={`${idPrefix}-${option.value}`}
              className="text-sm font-normal cursor-pointer"
            >
              {option.label}
            </Label>
          </div>
        ))}
      </div>
    </div>
  );
}
