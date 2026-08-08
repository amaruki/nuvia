"use client";

import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  ANNOUNCEMENT_TYPE_DISPLAY,
  ANNOUNCEMENT_PRIORITY_DISPLAY,
  ANNOUNCEMENT_TARGET_AUDIENCE_DISPLAY,
} from "@/types/announcement.types";
import { X } from "lucide-react";
import type { FiltersControlProps } from "./types";
import { removeArrayFilterValue } from "./filter-helpers";

export function ActiveFiltersBar({ filters, onFiltersChange }: FiltersControlProps) {
  return (
    <>
      <Separator />
      <div>
        <Label className="text-sm font-medium mb-2 block">Active Filters</Label>
        <div className="flex flex-wrap gap-2">
          {filters.search && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Search: {filters.search}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => onFiltersChange({ search: "" })}
              />
            </Badge>
          )}
          {filters.status?.map((status) => (
            <Badge key={status} variant="secondary" className="flex items-center gap-1">
              Status: {status}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() =>
                  onFiltersChange({ status: removeArrayFilterValue(filters.status, status) })
                }
              />
            </Badge>
          ))}
          {filters.type?.map((type) => (
            <Badge key={type} variant="secondary" className="flex items-center gap-1">
              Type: {ANNOUNCEMENT_TYPE_DISPLAY[type].name}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() =>
                  onFiltersChange({ type: removeArrayFilterValue(filters.type, type) })
                }
              />
            </Badge>
          ))}
          {filters.priority?.map((priority) => (
            <Badge key={priority} variant="secondary" className="flex items-center gap-1">
              Priority: {ANNOUNCEMENT_PRIORITY_DISPLAY[priority].name}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() =>
                  onFiltersChange({ priority: removeArrayFilterValue(filters.priority, priority) })
                }
              />
            </Badge>
          ))}
          {filters.targetAudience?.map((audience) => (
            <Badge key={audience} variant="secondary" className="flex items-center gap-1">
              Audience: {ANNOUNCEMENT_TARGET_AUDIENCE_DISPLAY[audience].name}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() =>
                  onFiltersChange({
                    targetAudience: removeArrayFilterValue(filters.targetAudience, audience),
                  })
                }
              />
            </Badge>
          ))}
          {filters.author?.map((author) => (
            <Badge key={author} variant="secondary" className="flex items-center gap-1">
              Author: {author}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() =>
                  onFiltersChange({ author: removeArrayFilterValue(filters.author, author) })
                }
              />
            </Badge>
          ))}
        </div>
      </div>
    </>
  );
}
