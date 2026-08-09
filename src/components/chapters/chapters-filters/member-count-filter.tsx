"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Users } from "lucide-react";
import { memberCountRanges } from "./constants";
import type { MemberCountFilterProps } from "./types";

export function MemberCountFilter({ range, onChange }: MemberCountFilterProps) {
  return (
    <div className="space-y-3">
      <Label className="flex items-center gap-2">
        <Users className="h-4 w-4" />
        Member Count
      </Label>
      <Select
        value={range ? `${range.min}-${range.max}` : ""}
        onValueChange={(value) => {
          const [min, max] = value.split("-").map(Number);
          onChange({ min, max });
        }}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select member count range" />
        </SelectTrigger>
        <SelectContent>
          {memberCountRanges.map((option) => (
            <SelectItem
              key={`${option.value.min}-${option.value.max}`}
              value={`${option.value.min}-${option.value.max}`}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
