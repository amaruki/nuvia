"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CheckboxFilterGroupProps } from "./types";

export function CheckboxFilterGroup({
  label,
  idPrefix,
  options,
  selected,
  listClassName,
  clearLabel,
  onToggle,
  onClear,
}: CheckboxFilterGroupProps) {
  return (
    <div className="space-y-3">
      <Label>{label}</Label>
      <div className={cn("space-y-2", listClassName)}>
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
      {selected && selected.length > 0 && clearLabel && onClear && (
        <Button variant="ghost" size="sm" onClick={onClear} className="text-xs">
          <X className="mr-1 h-3 w-3" />
          {clearLabel}
        </Button>
      )}
    </div>
  );
}
