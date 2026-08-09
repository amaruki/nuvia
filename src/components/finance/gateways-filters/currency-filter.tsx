"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";
import type { CurrencyFilterProps } from "./types";

export function CurrencyFilter({ options, selected, onToggle, onClear }: CurrencyFilterProps) {
  return (
    <div className="space-y-3">
      <Label>Currencies</Label>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <Badge
            key={option.value}
            variant={selected?.includes(option.value) ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => onToggle(option.value, !selected?.includes(option.value))}
          >
            {option.value}
          </Badge>
        ))}
      </div>
      {selected && selected.length > 0 && (
        <Button variant="ghost" size="sm" onClick={onClear} className="text-xs mt-2">
          <X className="mr-1 h-3 w-3" />
          Clear Currencies
        </Button>
      )}
    </div>
  );
}
