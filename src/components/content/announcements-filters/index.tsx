"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Search, Filter, ChevronDown, ChevronUp } from "lucide-react";
import type { AnnouncementsFiltersProps, FiltersControlProps } from "./types";
import { getActiveFilterCount } from "./filter-helpers";
import { BasicFilters } from "./basic-filters";
import { AnnouncementSpecificFilters } from "./announcement-specific-filters";
import { CheckboxFilters } from "./checkbox-filters";
import { ActiveFiltersBar } from "./active-filters-bar";

export function AnnouncementsFilters({
  filters,
  onFiltersChange,
  onReset,
}: AnnouncementsFiltersProps) {
  const [expandedSections, setExpandedSections] = useState<string[]>(["basic", "announcement"]);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) =>
      prev.includes(section) ? prev.filter((s) => s !== section) : [...prev, section],
    );
  };

  const handleFiltersChange: FiltersControlProps["onFiltersChange"] = (updated) =>
    onFiltersChange({
      ...filters,
      ...updated,
    });

  const clearAllFilters = () => {
    onReset();
  };

  const activeFiltersCount = getActiveFilterCount(filters);

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search announcements..."
              value={filters.search || ""}
              onChange={(e) => handleFiltersChange({ search: e.target.value })}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Filters Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {activeFiltersCount} active
                </Badge>
              )}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="text-muted-foreground hover:text-foreground"
            >
              Clear all
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Basic Filters */}
          <Collapsible
            open={expandedSections.includes("basic")}
            onOpenChange={() => toggleSection("basic")}
          >
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-0 h-auto font-normal">
                <span className="font-medium">Basic Filters</span>
                {expandedSections.includes("basic") ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 mt-4">
              <BasicFilters filters={filters} onFiltersChange={handleFiltersChange} />
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          {/* Announcement-Specific Filters */}
          <Collapsible
            open={expandedSections.includes("announcement")}
            onOpenChange={() => toggleSection("announcement")}
          >
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-0 h-auto font-normal">
                <span className="font-medium">Announcement Filters</span>
                {expandedSections.includes("announcement") ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 mt-4">
              <AnnouncementSpecificFilters
                filters={filters}
                onFiltersChange={handleFiltersChange}
              />
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          {/* Display Options */}
          <Collapsible
            open={expandedSections.includes("display")}
            onOpenChange={() => toggleSection("display")}
          >
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-0 h-auto font-normal">
                <span className="font-medium">Display Options</span>
                {expandedSections.includes("display") ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 mt-4">
              <CheckboxFilters filters={filters} onFiltersChange={handleFiltersChange} />
            </CollapsibleContent>
          </Collapsible>

          {/* Active Filters Summary */}
          {activeFiltersCount > 0 && (
            <ActiveFiltersBar filters={filters} onFiltersChange={handleFiltersChange} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
