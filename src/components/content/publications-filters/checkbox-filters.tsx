"use client";

import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  PUBLICATION_TYPES,
  PUBLICATION_CATEGORIES,
  PUBLICATION_STATUSES,
  type PublicationStatus,
  type PublicationType,
  type PublicationCategory,
} from "@/types/publication.types";
import type { FiltersControlProps } from "./types";

export function CheckboxFilters({ filters, onFiltersChange }: FiltersControlProps) {
  const handleStatusChange = (status: PublicationStatus, checked: boolean) => {
    const currentStatuses = filters.status || [];
    const newStatuses = checked
      ? [...currentStatuses, status]
      : currentStatuses.filter((s) => s !== status);
    onFiltersChange({ status: newStatuses });
  };

  const handleTypeChange = (type: PublicationType, checked: boolean) => {
    const currentTypes = filters.type || [];
    const newTypes = checked ? [...currentTypes, type] : currentTypes.filter((t) => t !== type);
    onFiltersChange({ type: newTypes });
  };

  const handleCategoryChange = (category: PublicationCategory, checked: boolean) => {
    const currentCategories = filters.category || [];
    const newCategories = checked
      ? [...currentCategories, category]
      : currentCategories.filter((c) => c !== category);
    onFiltersChange({ category: newCategories });
  };

  return (
    <>
      {/* Status Filter */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Status</Label>
        <div className="space-y-2 max-h-32 overflow-y-auto">
          {PUBLICATION_STATUSES.map((status) => (
            <div key={status} className="flex items-center space-x-2">
              <Checkbox
                id={`status-${status}`}
                checked={filters.status?.includes(status) || false}
                onCheckedChange={(checked: boolean) => handleStatusChange(status, checked)}
              />
              <Label htmlFor={`status-${status}`} className="text-sm font-normal cursor-pointer">
                {status.replace("_", " ")}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Type Filter */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Type</Label>
        <div className="space-y-2 max-h-32 overflow-y-auto">
          {PUBLICATION_TYPES.map((type) => (
            <div key={type} className="flex items-center space-x-2">
              <Checkbox
                id={`type-${type}`}
                checked={filters.type?.includes(type) || false}
                onCheckedChange={(checked: boolean) => handleTypeChange(type, checked)}
              />
              <Label htmlFor={`type-${type}`} className="text-sm font-normal cursor-pointer">
                {type.replace("_", " ")}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Category Filter */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Category</Label>
        <div className="space-y-2 max-h-32 overflow-y-auto">
          {PUBLICATION_CATEGORIES.map((category) => (
            <div key={category} className="flex items-center space-x-2">
              <Checkbox
                id={`category-${category}`}
                checked={filters.category?.includes(category) || false}
                onCheckedChange={(checked: boolean) => handleCategoryChange(category, checked)}
              />
              <Label
                htmlFor={`category-${category}`}
                className="text-sm font-normal cursor-pointer"
              >
                {category.replace("_", " ")}
              </Label>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
