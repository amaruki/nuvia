"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Check } from "lucide-react";
import { statusOptions } from "./options";

interface StatusFilterProps {
  selected: string[];
  onToggle: (status: string) => void;
}

export function StatusFilter({ selected, onToggle }: StatusFilterProps) {
  return (
    <div>
      <Label className="text-sm font-medium mb-3 text-muted-foreground">Status</Label>
      <div
        className="grid grid-cols-2 sm:grid-cols-4 gap-2"
        role="group"
        aria-label="Filter by status"
      >
        {statusOptions.map((option) => (
          <Button
            key={option.value}
            type="button"
            variant={selected.includes(option.value) ? "default" : "outline"}
            size="sm"
            onClick={() => onToggle(option.value)}
            className="text-xs justify-start"
            aria-pressed={selected.includes(option.value)}
          >
            {selected.includes(option.value) && <Check className="h-3 w-3 mr-1" />}
            {option.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
