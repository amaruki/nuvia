"use client";

import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";
import type { ActiveFiltersSummaryProps } from "./types";

export function ActiveFiltersSummary({
  filters,
  onFiltersChange,
  onStatusRemove,
  onTypeRemove,
  onRoleRemove,
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
            <X className="h-3 w-3 cursor-pointer" onClick={() => onStatusRemove(status)} />
          </Badge>
        ))}
        {filters.type?.map((type) => (
          <Badge key={type} variant="secondary" className="gap-1">
            Type: {type}
            <X className="h-3 w-3 cursor-pointer" onClick={() => onTypeRemove(type)} />
          </Badge>
        ))}
        {filters.memberRole?.map((role) => (
          <Badge key={role} variant="secondary" className="gap-1">
            Role: {role.replace("_", " ")}
            <X className="h-3 w-3 cursor-pointer" onClick={() => onRoleRemove(role)} />
          </Badge>
        ))}
        {filters.dateRange && (
          <Badge variant="secondary" className="gap-1">
            Date: {filters.dateRange.start.toLocaleDateString()} -{" "}
            {filters.dateRange.end.toLocaleDateString()}
            <X
              className="h-3 w-3 cursor-pointer"
              onClick={() => onFiltersChange({ dateRange: undefined })}
            />
          </Badge>
        )}
      </div>
    </div>
  );
}
