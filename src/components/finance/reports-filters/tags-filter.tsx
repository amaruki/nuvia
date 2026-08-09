"use client";

import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import type { TagsFilterProps } from "./types";

export function TagsFilter({ options, selected, onToggle }: TagsFilterProps) {
  return (
    <div className="space-y-3">
      <Label>Tags</Label>
      <div className="flex flex-wrap gap-2">
        {options.map((tag) => (
          <Badge
            key={tag}
            variant={selected?.includes(tag) ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => onToggle(tag, !selected?.includes(tag))}
          >
            {tag}
          </Badge>
        ))}
      </div>
    </div>
  );
}
