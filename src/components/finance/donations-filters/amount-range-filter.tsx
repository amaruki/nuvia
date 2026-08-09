"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AmountRangeFilterProps } from "./types";

export function AmountRangeFilter({ amountRange, onFiltersChange }: AmountRangeFilterProps) {
  const handleAmountRangeChange = (type: "min" | "max", value: string) => {
    const numValue = value ? parseFloat(value) : undefined;
    const currentRange = amountRange || { min: 0, max: 10000 };
    const newRange = { ...currentRange, [type]: numValue };

    onFiltersChange({
      amountRange: newRange.min !== undefined || newRange.max !== undefined ? newRange : undefined,
    });
  };

  return (
    <div className="space-y-2">
      <Label>Amount Range</Label>
      <div className="flex items-center space-x-2">
        <Input
          placeholder="Min"
          type="number"
          value={amountRange?.min || ""}
          onChange={(e) => handleAmountRangeChange("min", e.target.value)}
        />
        <span>-</span>
        <Input
          placeholder="Max"
          type="number"
          value={amountRange?.max || ""}
          onChange={(e) => handleAmountRangeChange("max", e.target.value)}
        />
      </div>
    </div>
  );
}
