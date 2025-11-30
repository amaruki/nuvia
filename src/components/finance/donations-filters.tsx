"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { DonationFilterOptions } from "@/types/finance.types";
import { CalendarIcon, X, Filter } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface DonationsFiltersProps {
  filters: DonationFilterOptions;
  onFiltersChange: (filters: Partial<DonationFilterOptions>) => void;
  onClearFilters: () => void;
}

const statusOptions = [
  { value: "pending", label: "Pending" },
  { value: "completed", label: "Completed" },
  { value: "failed", label: "Failed" },
  { value: "refunded", label: "Refunded" },
  { value: "pledged", label: "Pledged" },
];

const donorTypeOptions = [
  { value: "individual", label: "Individual" },
  { value: "organization", label: "Organization" },
  { value: "anonymous", label: "Anonymous" },
];

const donationTypeOptions = [
  { value: "one_time", label: "One Time" },
  { value: "recurring", label: "Recurring" },
  { value: "pledge", label: "Pledge" },
];

const campaignOptions = [
  { value: "Annual Fund Drive 2024", label: "Annual Fund Drive 2024" },
  { value: "Youth Education Initiative", label: "Youth Education Initiative" },
  { value: "Community Center Renovation", label: "Community Center Renovation" },
  { value: "Emergency Relief Fund", label: "Emergency Relief Fund" },
];

export function DonationsFilters({
  filters,
  onFiltersChange,
  onClearFilters,
}: DonationsFiltersProps) {
  const [dateRange, setDateRange] = useState<{
    start?: Date;
    end?: Date;
  }>({
    start: filters.dateRange?.start,
    end: filters.dateRange?.end,
  });

  const handleStatusChange = (status: string, checked: boolean) => {
    const currentStatuses = filters.status || [];
    const newStatuses = checked
      ? [...currentStatuses, status]
      : currentStatuses.filter(s => s !== status);
    
    onFiltersChange({ status: newStatuses.length > 0 ? newStatuses : undefined });
  };

  const handleDonorTypeChange = (donorType: string, checked: boolean) => {
    const currentDonorTypes = filters.donorType || [];
    const newDonorTypes = checked
      ? [...currentDonorTypes, donorType]
      : currentDonorTypes.filter(t => t !== donorType);
    
    onFiltersChange({ donorType: newDonorTypes.length > 0 ? newDonorTypes : undefined });
  };

  const handleDonationTypeChange = (donationType: string, checked: boolean) => {
    const currentDonationTypes = filters.donationType || [];
    const newDonationTypes = checked
      ? [...currentDonationTypes, donationType]
      : currentDonationTypes.filter(t => t !== donationType);
    
    onFiltersChange({ donationType: newDonationTypes.length > 0 ? newDonationTypes : undefined });
  };

  const handleCampaignChange = (campaign: string, checked: boolean) => {
    const currentCampaigns = filters.campaign || [];
    const newCampaigns = checked
      ? [...currentCampaigns, campaign]
      : currentCampaigns.filter(c => c !== campaign);
    
    onFiltersChange({ campaign: newCampaigns.length > 0 ? newCampaigns : undefined });
  };

  const handleDateRangeChange = (range: { start?: Date; end?: Date }) => {
    setDateRange(range);
    if (range.start && range.end) {
      onFiltersChange({ dateRange: { start: range.start, end: range.end } });
    } else if (!range.start && !range.end) {
      onFiltersChange({ dateRange: undefined });
    }
  };

  const handleAmountRangeChange = (type: "min" | "max", value: string) => {
    const numValue = value ? parseFloat(value) : undefined;
    const currentRange = filters.amountRange || { min: 0, max: 10000 };
    const newRange = { ...currentRange, [type]: numValue };
    
    onFiltersChange({ 
      amountRange: (newRange.min !== undefined || newRange.max !== undefined) ? newRange : undefined 
    });
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

        {/* Status */}
        <div className="space-y-2">
          <Label>Status</Label>
          <div className="flex flex-wrap gap-2">
            {statusOptions.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`status-${option.value}`}
                  checked={filters.status?.includes(option.value) || false}
                  onCheckedChange={(checked) => handleStatusChange(option.value, checked as boolean)}
                />
                <Label htmlFor={`status-${option.value}`} className="text-sm">
                  {option.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Donor Type */}
        <div className="space-y-2">
          <Label>Donor Type</Label>
          <div className="flex flex-wrap gap-2">
            {donorTypeOptions.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`donor-type-${option.value}`}
                  checked={filters.donorType?.includes(option.value) || false}
                  onCheckedChange={(checked) => handleDonorTypeChange(option.value, checked as boolean)}
                />
                <Label htmlFor={`donor-type-${option.value}`} className="text-sm">
                  {option.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Donation Type */}
        <div className="space-y-2">
          <Label>Donation Type</Label>
          <div className="flex flex-wrap gap-2">
            {donationTypeOptions.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`donation-type-${option.value}`}
                  checked={filters.donationType?.includes(option.value) || false}
                  onCheckedChange={(checked) => handleDonationTypeChange(option.value, checked as boolean)}
                />
                <Label htmlFor={`donation-type-${option.value}`} className="text-sm">
                  {option.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Campaign */}
        <div className="space-y-2">
          <Label>Campaign</Label>
          <div className="flex flex-wrap gap-2">
            {campaignOptions.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`campaign-${option.value}`}
                  checked={filters.campaign?.includes(option.value) || false}
                  onCheckedChange={(checked) => handleCampaignChange(option.value, checked as boolean)}
                />
                <Label htmlFor={`campaign-${option.value}`} className="text-sm">
                  {option.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Date Range */}
        <div className="space-y-2">
          <Label>Date Range</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !dateRange.start && !dateRange.end && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange.start ? (
                  dateRange.end ? (
                    <>
                      {format(dateRange.start, "LLL dd, y")} -{" "}
                      {format(dateRange.end, "LLL dd, y")}
                    </>
                  ) : (
                    format(dateRange.start, "LLL dd, y")
                  )
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange.start}
                selected={{
                  from: dateRange.start,
                  to: dateRange.end,
                }}
                onSelect={(range) => {
                  handleDateRangeChange({
                    start: range?.from,
                    end: range?.to,
                  });
                }}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Amount Range */}
        <div className="space-y-2">
          <Label>Amount Range</Label>
          <div className="flex items-center space-x-2">
            <Input
              placeholder="Min"
              type="number"
              value={filters.amountRange?.min || ""}
              onChange={(e) => handleAmountRangeChange("min", e.target.value)}
            />
            <span>-</span>
            <Input
              placeholder="Max"
              type="number"
              value={filters.amountRange?.max || ""}
              onChange={(e) => handleAmountRangeChange("max", e.target.value)}
            />
          </div>
        </div>

        {/* Active Filters Summary */}
        {hasActiveFilters && (
          <div className="space-y-2">
            <Label>Active Filters</Label>
            <div className="flex flex-wrap gap-2">
              {filters.status?.map((status) => (
                <Badge key={status} variant="secondary" className="text-xs">
                  Status: {status}
                </Badge>
              ))}
              {filters.donorType?.map((type) => (
                <Badge key={type} variant="secondary" className="text-xs">
                  Donor: {type}
                </Badge>
              ))}
              {filters.donationType?.map((type) => (
                <Badge key={type} variant="secondary" className="text-xs">
                  Type: {type}
                </Badge>
              ))}
              {filters.campaign?.map((campaign) => (
                <Badge key={campaign} variant="secondary" className="text-xs">
                  Campaign: {campaign}
                </Badge>
              ))}
              {filters.dateRange && (
                <Badge variant="secondary" className="text-xs">
                  Date Range
                </Badge>
              )}
              {filters.amountRange && (
                <Badge variant="secondary" className="text-xs">
                  Amount Range
                </Badge>
              )}
              {filters.search && (
                <Badge variant="secondary" className="text-xs">
                  Search: {filters.search}
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}