"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarIcon, X, Filter } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { ReportFilterOptions } from "@/types/finance.types";

interface ReportsFiltersProps {
  filters: ReportFilterOptions;
  onFiltersChange: (filters: Partial<ReportFilterOptions>) => void;
  onClearFilters: () => void;
}

const reportTypes = [
  { value: "income_statement", label: "Income Statement" },
  { value: "balance_sheet", label: "Balance Sheet" },
  { value: "cash_flow", label: "Cash Flow" },
  { value: "budget_vs_actual", label: "Budget vs Actual" },
  { value: "tax_document", label: "Tax Document" },
  { value: "audit_trail", label: "Audit Trail" },
];

const reportStatuses = [
  { value: "draft", label: "Draft" },
  { value: "pending_review", label: "Pending Review" },
  { value: "approved", label: "Approved" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];

const reportPeriods = [
  { value: "Q1 2024", label: "Q1 2024" },
  { value: "Q2 2024", label: "Q2 2024" },
  { value: "Q3 2024", label: "Q3 2024" },
  { value: "Q4 2024", label: "Q4 2024" },
  { value: "FY 2023", label: "FY 2023" },
  { value: "FY 2024", label: "FY 2024" },
];

const generatedByOptions = [
  { value: "John Smith", label: "John Smith" },
  { value: "Emily Chen", label: "Emily Chen" },
  { value: "David Wilson", label: "David Wilson" },
  { value: "Robert Taylor", label: "Robert Taylor" },
  { value: "William Garcia", label: "William Garcia" },
  { value: "James Thompson", label: "James Thompson" },
  { value: "Mary White", label: "Mary White" },
  { value: "Christopher Lee", label: "Christopher Lee" },
];

const commonTags = [
  "quarterly",
  "annual",
  "monthly",
  "income",
  "expense",
  "budget",
  "tax",
  "audit",
  "2023",
  "2024",
  "draft",
  "published",
];

export function ReportsFilters({ filters, onFiltersChange, onClearFilters }: ReportsFiltersProps) {
  const [dateRange, setDateRange] = useState<{ start?: Date; end?: Date }>({
    start: filters.dateRange?.start,
    end: filters.dateRange?.end,
  });

  const handleTypeChange = (type: string, checked: boolean) => {
    const currentTypes = filters.type || [];
    const newTypes = checked ? [...currentTypes, type] : currentTypes.filter((t) => t !== type);
    onFiltersChange({ type: newTypes });
  };

  const handleStatusChange = (status: string, checked: boolean) => {
    const currentStatuses = filters.status || [];
    const newStatuses = checked
      ? [...currentStatuses, status]
      : currentStatuses.filter((s) => s !== status);
    onFiltersChange({ status: newStatuses });
  };

  const handlePeriodChange = (period: string, checked: boolean) => {
    const currentPeriods = filters.period || [];
    const newPeriods = checked
      ? [...currentPeriods, period]
      : currentPeriods.filter((p) => p !== period);
    onFiltersChange({ period: newPeriods });
  };

  const handleGeneratedByChange = (generatedBy: string, checked: boolean) => {
    const currentGeneratedBy = filters.generatedBy || [];
    const newGeneratedBy = checked
      ? [...currentGeneratedBy, generatedBy]
      : currentGeneratedBy.filter((g) => g !== generatedBy);
    onFiltersChange({ generatedBy: newGeneratedBy });
  };

  const handleTagChange = (tag: string, checked: boolean) => {
    const currentTags = filters.tags || [];
    const newTags = checked ? [...currentTags, tag] : currentTags.filter((t) => t !== tag);
    onFiltersChange({ tags: newTags });
  };

  const handleDateRangeChange = (type: "start" | "end", date?: Date) => {
    const newDateRange = { ...dateRange, [type]: date };
    setDateRange(newDateRange);

    if (newDateRange.start && newDateRange.end) {
      onFiltersChange({ dateRange: { start: newDateRange.start, end: newDateRange.end } });
    }
  };

  const handleSearchChange = (value: string) => {
    onFiltersChange({ search: value });
  };

  const clearAllFilters = () => {
    setDateRange({ start: undefined, end: undefined });
    onClearFilters();
  };

  const hasActiveFilters = !!(
    filters.type?.length ||
    filters.status?.length ||
    filters.period?.length ||
    filters.dateRange?.start ||
    filters.dateRange?.end ||
    filters.generatedBy?.length ||
    filters.tags?.length ||
    filters.search
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearAllFilters}>
              <X className="h-4 w-4 mr-1" />
              Clear All
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Search */}
        <div className="space-y-2">
          <Label htmlFor="search">Search</Label>
          <Input
            id="search"
            placeholder="Search reports..."
            value={filters.search || ""}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>

        {/* Report Types */}
        <div className="space-y-3">
          <Label>Report Types</Label>
          <div className="grid grid-cols-2 gap-2">
            {reportTypes.map((type) => (
              <div key={type.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`type-${type.value}`}
                  checked={filters.type?.includes(type.value) || false}
                  onCheckedChange={(checked) => handleTypeChange(type.value, checked as boolean)}
                />
                <Label
                  htmlFor={`type-${type.value}`}
                  className="text-sm font-normal cursor-pointer"
                >
                  {type.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Status */}
        <div className="space-y-3">
          <Label>Status</Label>
          <div className="grid grid-cols-2 gap-2">
            {reportStatuses.map((status) => (
              <div key={status.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`status-${status.value}`}
                  checked={filters.status?.includes(status.value) || false}
                  onCheckedChange={(checked) =>
                    handleStatusChange(status.value, checked as boolean)
                  }
                />
                <Label
                  htmlFor={`status-${status.value}`}
                  className="text-sm font-normal cursor-pointer"
                >
                  {status.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Period */}
        <div className="space-y-3">
          <Label>Period</Label>
          <div className="grid grid-cols-2 gap-2">
            {reportPeriods.map((period) => (
              <div key={period.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`period-${period.value}`}
                  checked={filters.period?.includes(period.value) || false}
                  onCheckedChange={(checked) =>
                    handlePeriodChange(period.value, checked as boolean)
                  }
                />
                <Label
                  htmlFor={`period-${period.value}`}
                  className="text-sm font-normal cursor-pointer"
                >
                  {period.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Date Range */}
        <div className="space-y-3">
          <Label>Date Range</Label>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label className="text-sm">Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateRange.start && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.start ? format(dateRange.start, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateRange.start}
                    onSelect={(date) => handleDateRangeChange("start", date)}
                    autoFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label className="text-sm">End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateRange.end && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.end ? format(dateRange.end, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateRange.end}
                    onSelect={(date) => handleDateRangeChange("end", date)}
                    autoFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        {/* Generated By */}
        <div className="space-y-3">
          <Label>Generated By</Label>
          <div className="grid grid-cols-2 gap-2">
            {generatedByOptions.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`generated-by-${option.value}`}
                  checked={filters.generatedBy?.includes(option.value) || false}
                  onCheckedChange={(checked) =>
                    handleGeneratedByChange(option.value, checked as boolean)
                  }
                />
                <Label
                  htmlFor={`generated-by-${option.value}`}
                  className="text-sm font-normal cursor-pointer"
                >
                  {option.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Tags */}
        <div className="space-y-3">
          <Label>Tags</Label>
          <div className="flex flex-wrap gap-2">
            {commonTags.map((tag) => (
              <Badge
                key={tag}
                variant={filters.tags?.includes(tag) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => handleTagChange(tag, !filters.tags?.includes(tag))}
              >
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
