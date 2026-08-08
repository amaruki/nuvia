"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { logger } from "@/lib/logger";
import type { FilterControlProps } from "./types";
import { commonTags } from "./constants";
import { toggleArrayValue } from "./filter-helpers";
import { BadgeToggleGroup } from "./badge-toggle-group";

export function TagsFilter({ filters, onFiltersChange }: FilterControlProps) {
  const handleTagToggle = (tag: string) => {
    onFiltersChange({ ...filters, tags: toggleArrayValue(filters.tags, tag) });
  };

  return (
    <BadgeToggleGroup
      label="Tags"
      options={commonTags}
      selected={filters.tags}
      onToggle={handleTagToggle}
    >
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          // This would open a tag management dialog in a real implementation
          logger.info("Add custom tag");
        }}
      >
        <Plus className="h-3 w-3 mr-1" />
        Custom
      </Button>
    </BadgeToggleGroup>
  );
}
