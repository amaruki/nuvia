"use client";

import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";
import type { ActiveFiltersSummaryProps } from "./types";

export function ActiveFiltersSummary({
  filters,
  onFiltersChange,
  onStatusToggle,
  onTypeToggle,
  onAuthorityToggle,
}: ActiveFiltersSummaryProps) {
  return (
    <div className="space-y-3">
      <Label>Active Filters</Label>
      <div className="flex flex-wrap gap-2">
        {filters.search && (
          <Badge variant="secondary" className="gap-1">
            Search: "{filters.search}"
            <X
              className="h-3 w-3 cursor-pointer"
              onClick={() => onFiltersChange({ search: undefined })}
            />
          </Badge>
        )}
        {filters.status?.map((status) => (
          <Badge key={status} variant="secondary" className="gap-1">
            Status: {status}
            <X className="h-3 w-3 cursor-pointer" onClick={() => onStatusToggle(status, false)} />
          </Badge>
        ))}
        {filters.type?.map((type) => (
          <Badge key={type} variant="secondary" className="gap-1">
            Type: {type.replace("_", " ")}
            <X className="h-3 w-3 cursor-pointer" onClick={() => onTypeToggle(type, false)} />
          </Badge>
        ))}
        {filters.authorityLevel?.map((authority) => (
          <Badge key={authority} variant="secondary" className="gap-1">
            Authority: {authority}
            <X
              className="h-3 w-3 cursor-pointer"
              onClick={() => onAuthorityToggle(authority, false)}
            />
          </Badge>
        ))}
        {filters.memberCountRange && (
          <Badge variant="secondary" className="gap-1">
            Members: {filters.memberCountRange.min}-{filters.memberCountRange.max}
            <X
              className="h-3 w-3 cursor-pointer"
              onClick={() => onFiltersChange({ memberCountRange: undefined })}
            />
          </Badge>
        )}
      </div>
    </div>
  );
}
