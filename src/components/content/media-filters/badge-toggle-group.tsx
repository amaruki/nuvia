"use client";

import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";

export interface BadgeToggleGroupProps<T extends string> {
  label: string;
  options: readonly T[];
  selected: readonly T[] | undefined;
  onToggle: (value: T) => void;
  children?: ReactNode;
}

export function BadgeToggleGroup<T extends string>({
  label,
  options,
  selected,
  onToggle,
  children,
}: BadgeToggleGroupProps<T>) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isSelected = selected?.includes(option);
          return (
            <Badge
              key={option}
              variant={isSelected ? "default" : "outline"}
              className="cursor-pointer hover:bg-accent"
              onClick={() => onToggle(option)}
            >
              {option}
            </Badge>
          );
        })}
        {children}
      </div>
    </div>
  );
}
