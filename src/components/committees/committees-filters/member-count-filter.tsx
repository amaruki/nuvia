"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { MemberCountFilterProps } from "./types";

export function MemberCountFilter({ range, onChange }: MemberCountFilterProps) {
  const handleFieldChange = (field: "min" | "max", value: string) => {
    const numValue = parseInt(value) || 0;
    const currentRange = range || { min: 0, max: 100 };

    onChange({
      ...currentRange,
      [field]: numValue,
    });
  };

  return (
    <div className="space-y-3">
      <Label>Member Count Range</Label>
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <Label htmlFor="min-members" className="text-sm text-muted-foreground">
            Minimum
          </Label>
          <Input
            id="min-members"
            type="number"
            placeholder="0"
            value={range?.min.toString() || ""}
            onChange={(e) => handleFieldChange("min", e.target.value)}
            min="0"
          />
        </div>
        <div className="flex items-center justify-center h-10">
          <span className="text-muted-foreground">to</span>
        </div>
        <div className="flex-1">
          <Label htmlFor="max-members" className="text-sm text-muted-foreground">
            Maximum
          </Label>
          <Input
            id="max-members"
            type="number"
            placeholder="100"
            value={range?.max.toString() || ""}
            onChange={(e) => handleFieldChange("max", e.target.value)}
            min="0"
          />
        </div>
      </div>
    </div>
  );
}
