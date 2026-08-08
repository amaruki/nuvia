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
import { InvoiceFilterOptions } from "@/types/finance";

interface InvoicesFiltersProps {
  filters: InvoiceFilterOptions;
  onFiltersChange: (filters: Partial<InvoiceFilterOptions>) => void;
  onClearFilters: () => void;
}

export function InvoicesFilters({
  filters,
  onFiltersChange,
  onClearFilters,
}: InvoicesFiltersProps) {
  const [dateRangeStart, setDateRangeStart] = useState<Date | undefined>(filters.dateRange?.start);
  const [dateRangeEnd, setDateRangeEnd] = useState<Date | undefined>(filters.dateRange?.end);

  const handleStatusChange = (value: string) => {
    if (value === "all") {
      onFiltersChange({ status: undefined });
    } else {
      onFiltersChange({ status: [value] });
    }
  };

  const handleClientChange = (value: string) => {
    if (value === "all") {
      onFiltersChange({ client: undefined });
    } else {
      onFiltersChange({ client: [value] });
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
    filters.client?.length ||
    filters.dateRange ||
    filters.amountRange ||
    filters.search
  );

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.status?.length) count++;
    if (filters.client?.length) count++;
    if (filters.dateRange) count++;
    if (filters.amountRange) count++;
    if (filters.search) count++;
    return count;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <CardTitle className="text-lg">Filters</CardTitle>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <Badge variant="secondary" className="text-xs">
                {getActiveFilterCount()} active
              </Badge>
            )}
            <Button variant="outline" size="sm" onClick={onClearFilters}>
              <X className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Clear All</span>
              <span className="sm:hidden">Clear</span>
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
            placeholder="Search by client name, email, or invoice number..."
            value={filters.search || ""}
            onChange={(e) => onFiltersChange({ search: e.target.value })}
            className="text-sm"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Status Filter */}
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={filters.status?.[0] || "all"} onValueChange={handleStatusChange}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Client Filter */}
          <div className="space-y-2">
            <Label>Client</Label>
            <Select value={filters.client?.[0] || "all"} onValueChange={handleClientChange}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Select client" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Clients</SelectItem>
                <SelectItem value="client-1">TechCorp Solutions</SelectItem>
                <SelectItem value="client-2">Global Marketing Inc</SelectItem>
                <SelectItem value="client-3">Startup Ventures LLC</SelectItem>
                <SelectItem value="client-4">Digital Agency Pro</SelectItem>
                <SelectItem value="client-5">E-commerce Store Co</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Date Range Filter */}
        <div className="space-y-2">
          <Label>Issue Date Range</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal text-sm h-10",
                    !dateRangeStart && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                  <span className="truncate">
                    {dateRangeStart ? format(dateRangeStart, "PPP") : "Start date"}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={dateRangeStart} onSelect={setDateRangeStart} />
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal text-sm h-10",
                    !dateRangeEnd && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                  <span className="truncate">
                    {dateRangeEnd ? format(dateRangeEnd, "PPP") : "End date"}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={dateRangeEnd} onSelect={setDateRangeEnd} />
              </PopoverContent>
            </Popover>
          </div>
          {dateRangeStart && dateRangeEnd && (
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDateRangeChange}
                className="text-sm"
              >
                <Filter className="h-4 w-4 mr-1" />
                Apply Date Range
              </Button>
              <Button variant="ghost" size="sm" onClick={handleClearDateRange} className="text-sm">
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            </div>
          )}
        </div>

        {/* Amount Range Filter */}
        <div className="space-y-2">
          <Label>Amount Range</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Input
              type="number"
              placeholder="Min amount"
              value={filters.amountRange?.min || ""}
              onChange={(e) =>
                onFiltersChange({
                  amountRange: {
                    ...filters.amountRange,
                    min: parseFloat(e.target.value) || 0,
                    max: filters.amountRange?.max || 0,
                  },
                })
              }
              className="text-sm"
            />
            <Input
              type="number"
              placeholder="Max amount"
              value={filters.amountRange?.max || ""}
              onChange={(e) =>
                onFiltersChange({
                  amountRange: {
                    ...filters.amountRange,
                    min: filters.amountRange?.min || 0,
                    max: parseFloat(e.target.value) || 0,
                  },
                })
              }
              className="text-sm"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
