"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Check } from "lucide-react";

interface FormatFilterProps {
  isVirtual?: boolean;
  isInPerson?: boolean;
  onToggleVirtual: () => void;
  onToggleInPerson: () => void;
}

export function FormatFilter({
  isVirtual,
  isInPerson,
  onToggleVirtual,
  onToggleInPerson,
}: FormatFilterProps) {
  return (
    <div>
      <Label className="text-sm font-medium mb-3 text-muted-foreground">Format</Label>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by format">
        <Button
          type="button"
          variant={isVirtual ? "default" : "outline"}
          size="sm"
          onClick={onToggleVirtual}
          className="text-xs"
          aria-pressed={isVirtual}
        >
          {isVirtual && <Check className="h-3 w-3 mr-1" />}
          Virtual
        </Button>
        <Button
          type="button"
          variant={isInPerson ? "default" : "outline"}
          size="sm"
          onClick={onToggleInPerson}
          className="text-xs"
          aria-pressed={isInPerson}
        >
          {isInPerson && <Check className="h-3 w-3 mr-1" />}
          In-Person
        </Button>
      </div>
    </div>
  );
}
