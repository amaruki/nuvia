"use client";

import { useState } from "react";
import { Filter, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { getActiveFilterCount } from "./helpers";
import FilterDialog from "./filter-dialog";
import type { MembershipFilterProps } from "./types";

export function MembershipFilter({ filters, onFiltersChange, isLoading }: MembershipFilterProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSearchChange = (value: string) => {
    onFiltersChange({
      ...filters,
      search: value || undefined,
    });
  };

  const clearAllFilters = () => {
    onFiltersChange({});
  };

  const activeFiltersCount = getActiveFilterCount(filters);

  return (
    <div className="flex flex-col space-y-4">
      {/* Search Bar with Filter Button */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-4" />
        <Input
          placeholder="Search by name, email, or company..."
          value={filters.search || ""}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-10 pr-32"
          disabled={isLoading}
        />

        {/* Filter Button Inside Search Bar */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2">
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-3 hover:bg-accent"
                disabled={isLoading}
              >
                <Filter className="size-4 mr-1" />
                Filters
                {activeFiltersCount > 0 && (
                  <Badge
                    variant="secondary"
                    className="ml-1 size-5 p-0 flex items-center justify-center text-xs bg-primary text-primary-foreground"
                  >
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </DialogTrigger>

            <FilterDialog
              filters={filters}
              onFiltersChange={onFiltersChange}
              isLoading={isLoading}
              activeFiltersCount={activeFiltersCount}
              onClearAll={clearAllFilters}
              onDone={() => setIsOpen(false)}
            />
          </Dialog>
        </div>
      </div>
    </div>
  );
}
