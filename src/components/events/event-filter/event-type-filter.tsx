"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Check } from "lucide-react";
import { eventTypeOptions } from "./options";

interface EventTypeFilterProps {
  selected: string[];
  onToggle: (eventType: string) => void;
}

export function EventTypeFilter({ selected, onToggle }: EventTypeFilterProps) {
  return (
    <div>
      <Label className="text-sm font-medium mb-3 text-muted-foreground">Event Type</Label>
      <div
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2"
        role="group"
        aria-label="Filter by event type"
      >
        {eventTypeOptions.map((option) => (
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
