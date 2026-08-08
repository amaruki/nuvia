"use client";

import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { statusOptions, eventTypeOptions } from "./options";
import type { FilterChipKind } from "./types";

interface ActiveFilterChip {
  id: string;
  kind: FilterChipKind;
  value: string;
  label: string;
}

interface ActiveFilterChipsProps {
  status: string[];
  eventType: string[];
  tags: string[];
  isVirtual?: boolean;
  isInPerson?: boolean;
  onRemove: (kind: FilterChipKind, value: string) => void;
}

export function ActiveFilterChips({
  status,
  eventType,
  tags,
  isVirtual,
  isInPerson,
  onRemove,
}: ActiveFilterChipsProps) {
  const chips: ActiveFilterChip[] = [
    ...status.map((value) => ({
      id: `status:${value}`,
      kind: "status" as const,
      value,
      label: statusOptions.find((option) => option.value === value)?.label ?? value,
    })),
    ...eventType.map((value) => ({
      id: `eventType:${value}`,
      kind: "eventType" as const,
      value,
      label: eventTypeOptions.find((option) => option.value === value)?.label ?? value,
    })),
    ...(isVirtual
      ? [{ id: "format:virtual", kind: "format" as const, value: "virtual", label: "Virtual" }]
      : []),
    ...(isInPerson
      ? [
          {
            id: "format:in-person",
            kind: "format" as const,
            value: "in-person",
            label: "In-Person",
          },
        ]
      : []),
    ...tags.map((value) => ({
      id: `tag:${value}`,
      kind: "tag" as const,
      value,
      label: value,
    })),
  ];

  if (chips.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2" aria-label="Active filters">
      <span className="text-sm font-medium text-muted-foreground">Active Filters:</span>
      {chips.map((chip) => (
        <Badge key={chip.id} variant="secondary" className="gap-1">
          {chip.label}
          <button
            type="button"
            onClick={() => onRemove(chip.kind, chip.value)}
            className="ml-1 hover:bg-destructive hover:text-destructive-foreground rounded-full p-0.5"
            aria-label={`Remove ${chip.label} filter`}
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
    </div>
  );
}
