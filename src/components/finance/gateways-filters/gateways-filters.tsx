"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, Search, X, Filter, RotateCcw } from "lucide-react";
import type { GatewayFilterOptions } from "@/types/finance";
import type { ArrayFilterKey, GatewaysFiltersProps } from "./types";
import { currencyOptions, environmentOptions, providerOptions, statusOptions } from "./constants";
import { CheckboxFilterGroup } from "./checkbox-filter-group";
import { CurrencyFilter } from "./currency-filter";

export function GatewaysFilters({
  filters,
  onFiltersChange,
  onClearFilters,
}: GatewaysFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  const hasActiveFilters = !!(
    filters.search ||
    filters.status?.length ||
    filters.provider?.length ||
    filters.environment?.length ||
    filters.currency?.length
  );

  const handleArrayFilterChange = (key: ArrayFilterKey, value: string, checked: boolean) => {
    const current = filters[key] || [];
    const next = checked ? [...current, value] : current.filter((item) => item !== value);
    onFiltersChange({ [key]: next });
  };

  const clearFilter = (filterType: keyof GatewayFilterOptions) => {
    onFiltersChange({ [filterType]: undefined });
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.status?.length) count++;
    if (filters.provider?.length) count++;
    if (filters.environment?.length) count++;
    if (filters.currency?.length) count++;
    return count;
  };

  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="pb-3 cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4" />
                <CardTitle className="text-sm font-medium">Filters</CardTitle>
                {hasActiveFilters && (
                  <Badge variant="secondary" className="text-xs">
                    {getActiveFilterCount()} active
                  </Badge>
                )}
              </div>
              {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="space-y-6 pt-0">
            {/* Search */}
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by name, provider, or description..."
                  value={filters.search || ""}
                  onChange={(e) => onFiltersChange({ search: e.target.value })}
                  className="pl-10"
                />
                {filters.search && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                    onClick={() => clearFilter("search")}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* Status Filter */}
              <CheckboxFilterGroup
                label="Status"
                idPrefix="status"
                options={statusOptions}
                selected={filters.status}
                clearLabel="Clear Status"
                onToggle={(value, checked) => handleArrayFilterChange("status", value, checked)}
                onClear={() => clearFilter("status")}
              />

              {/* Provider Filter */}
              <CheckboxFilterGroup
                label="Provider"
                idPrefix="provider"
                options={providerOptions}
                selected={filters.provider}
                listClassName="max-h-40 overflow-y-auto"
                clearLabel="Clear Provider"
                onToggle={(value, checked) => handleArrayFilterChange("provider", value, checked)}
                onClear={() => clearFilter("provider")}
              />

              {/* Environment Filter */}
              <CheckboxFilterGroup
                label="Environment"
                idPrefix="environment"
                options={environmentOptions}
                selected={filters.environment}
                clearLabel="Clear Environment"
                onToggle={(value, checked) =>
                  handleArrayFilterChange("environment", value, checked)
                }
                onClear={() => clearFilter("environment")}
              />
            </div>

            {/* Currency Filter */}
            <CurrencyFilter
              options={currencyOptions}
              selected={filters.currency}
              onToggle={(value, checked) => handleArrayFilterChange("currency", value, checked)}
              onClear={() => clearFilter("currency")}
            />

            {/* Clear All Filters */}
            {hasActiveFilters && (
              <div className="flex justify-center pt-2 border-t">
                <Button variant="outline" onClick={onClearFilters} className="text-sm">
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Clear All Filters
                </Button>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
