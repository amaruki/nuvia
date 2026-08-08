"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, X, Filter } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { DueFilterOptions } from "@/types/finance.types";
import { MembershipTier } from "@/types/membership.types";

interface DuesFiltersProps {
  filters: DueFilterOptions;
  onFiltersChange: (filters: Partial<DueFilterOptions>) => void;
  onClearFilters: () => void;
}

export function DuesFilters({ filters, onFiltersChange, onClearFilters }: DuesFiltersProps) {
  const [dateRangeStart, setDateRangeStart] = useState<Date | undefined>(filters.dateRange?.start);
  const [dateRangeEnd, setDateRangeEnd] = useState<Date | undefined>(filters.dateRange?.end);

  const handleStatusChange = (value: string) => {
    if (value === "all") {
      onFiltersChange({ status: undefined });
    } else {
      onFiltersChange({ status: [value] });
    }
  };

  const handleTierChange = (value: string) => {
    if (value === "all") {
      onFiltersChange({ tier: undefined });
    } else {
      onFiltersChange({ tier: [value] });
    }
  };

  const handleDateRangeChange = () => {
    if (dateRangeStart && dateRangeEnd) {
      onFiltersChange({
        dateRange: {
          start: dateRangeStart,
          end: dateRangeEnd,
        },
      });
    }
  };

  const handleClearDateRange = () => {
    setDateRangeStart(undefined);
    setDateRangeEnd(undefined);
    onFiltersChange({ dateRange: undefined });
  };

  const hasActiveFilters = !!(
    filters.status?.length ||
    filters.tier?.length ||
    filters.dateRange ||
    filters.amountRange ||
    filters.search
  );

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.status?.length) count++;
    if (filters.tier?.length) count++;
    if (filters.dateRange) count++;
    if (filters.amountRange) count++;
    if (filters.search) count++;
    return count;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Filters</CardTitle>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <Badge variant="secondary" className="text-xs">
                {getActiveFilterCount()} active
              </Badge>
            )}
            <Button variant="outline" size="sm" onClick={onClearFilters}>
              <X className="h-4 w-4 mr-1" />
              Clear All
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="space-y-2">
          <Label htmlFor="search">Search</Label>
          <Input
            id="search"
            placeholder="Search by name, email, or tier..."
            value={filters.search || ""}
            onChange={(e) => onFiltersChange({ search: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Status Filter */}
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={filters.status?.[0] || "all"} onValueChange={handleStatusChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tier Filter */}
          <div className="space-y-2">
            <Label>Membership Tier</Label>
            <Select value={filters.tier?.[0] || "all"} onValueChange={handleTierChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select tier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tiers</SelectItem>
                <SelectItem value={MembershipTier.BASIC}>Basic</SelectItem>
                <SelectItem value={MembershipTier.STUDENT}>Student</SelectItem>
                <SelectItem value={MembershipTier.PROFESSIONAL}>Professional</SelectItem>
                <SelectItem value={MembershipTier.CORPORATE}>Corporate</SelectItem>
                <SelectItem value={MembershipTier.VIP}>VIP</SelectItem>
                <SelectItem value={MembershipTier.PREMIUM}>Premium</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Date Range Filter */}
        <div className="space-y-2">
          <Label>Due Date Range</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dateRangeStart && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRangeStart ? format(dateRangeStart, "PPP") : "Start date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={dateRangeStart} onSelect={setDateRangeStart} />
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dateRangeEnd && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRangeEnd ? format(dateRangeEnd, "PPP") : "End date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={dateRangeEnd} onSelect={setDateRangeEnd} />
              </PopoverContent>
            </Popover>
          </div>
          {dateRangeStart && dateRangeEnd && (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleDateRangeChange}>
                <Filter className="h-4 w-4 mr-1" />
                Apply Date Range
              </Button>
              <Button variant="ghost" size="sm" onClick={handleClearDateRange}>
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            </div>
          )}
        </div>

        {/* Amount Range Filter */}
        <div className="space-y-2">
          <Label>Amount Range</Label>
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="number"
              placeholder="Min amount"
              value={filters.amountRange?.min || ""}
              onChange={(e) => {
                const value = parseFloat(e.target.value) || 0;
                const currentMax = filters.amountRange?.max || 0;
                onFiltersChange({
                  amountRange: {
                    min: value,
                    max: currentMax,
                  },
                });
              }}
            />
            <Input
              type="number"
              placeholder="Max amount"
              value={filters.amountRange?.max || ""}
              onChange={(e) => {
                const value = parseFloat(e.target.value) || 0;
                const currentMin = filters.amountRange?.min || 0;
                onFiltersChange({
                  amountRange: {
                    min: currentMin,
                    max: value,
                  },
                });
              }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
