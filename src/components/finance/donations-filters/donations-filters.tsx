"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Filter, X } from "lucide-react";
import type { ArrayFilterKey, DonationsFiltersProps } from "./types";
import { campaignOptions, donationTypeOptions, donorTypeOptions, statusOptions } from "./constants";
import { ActiveFiltersSummary } from "./active-filters-summary";
import { AmountRangeFilter } from "./amount-range-filter";
import { CheckboxFilterGroup } from "./checkbox-filter-group";
import { DateRangeFilter } from "./date-range-filter";

export function DonationsFilters({
  filters,
  onFiltersChange,
  onClearFilters,
}: DonationsFiltersProps) {
  const handleArrayFilterChange = (key: ArrayFilterKey, value: string, checked: boolean) => {
    const current = filters[key] || [];
    const next = checked ? [...current, value] : current.filter((item) => item !== value);

    onFiltersChange({ [key]: next.length > 0 ? next : undefined });
  };

  const handleDateRangeChange = (range: { start?: Date; end?: Date }) => {
    if (range.start && range.end) {
      onFiltersChange({ dateRange: { start: range.start, end: range.end } });
    } else if (!range.start && !range.end) {
      onFiltersChange({ dateRange: undefined });
    }
  };

  const hasActiveFilters = !!(
    filters.status?.length ||
    filters.donorType?.length ||
    filters.donationType?.length ||
    filters.campaign?.length ||
    filters.dateRange ||
    filters.amountRange ||
    filters.search
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center">
          <Filter className="mr-2 h-5 w-5" />
          Filters
        </CardTitle>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={onClearFilters}>
            <X className="mr-2 h-4 w-4" />
            Clear All
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Search */}
        <div className="space-y-2">
          <Label htmlFor="search">Search</Label>
          <Input
            id="search"
            placeholder="Search by donor name, email, or notes..."
            value={filters.search || ""}
            onChange={(e) => onFiltersChange({ search: e.target.value || undefined })}
          />
        </div>

        <CheckboxFilterGroup
          label="Status"
          idPrefix="status"
          options={statusOptions}
          selected={filters.status}
          onToggle={(value, checked) => handleArrayFilterChange("status", value, checked)}
        />

        <CheckboxFilterGroup
          label="Donor Type"
          idPrefix="donor-type"
          options={donorTypeOptions}
          selected={filters.donorType}
          onToggle={(value, checked) => handleArrayFilterChange("donorType", value, checked)}
        />

        <CheckboxFilterGroup
          label="Donation Type"
          idPrefix="donation-type"
          options={donationTypeOptions}
          selected={filters.donationType}
          onToggle={(value, checked) => handleArrayFilterChange("donationType", value, checked)}
        />

        <CheckboxFilterGroup
          label="Campaign"
          idPrefix="campaign"
          options={campaignOptions}
          selected={filters.campaign}
          onToggle={(value, checked) => handleArrayFilterChange("campaign", value, checked)}
        />

        <DateRangeFilter
          initialStart={filters.dateRange?.start}
          initialEnd={filters.dateRange?.end}
          onRangeChange={handleDateRangeChange}
        />

        <AmountRangeFilter amountRange={filters.amountRange} onFiltersChange={onFiltersChange} />

        {hasActiveFilters && <ActiveFiltersSummary filters={filters} />}
      </CardContent>
    </Card>
  );
}
