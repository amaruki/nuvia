"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import type { ArticleStatus } from "@/types/article.types";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Clock, CheckCircle2, Archive } from "lucide-react";
import type { FiltersControlProps } from "./types";
import { toggleArrayFilterValue } from "./filter-helpers";

export function BasicFilters({ filters, onFiltersChange }: FiltersControlProps) {
  return (
    <>
      {/* Status */}
      <div>
        <Label className="text-sm font-medium mb-2 block">Status</Label>
        <div className="flex flex-wrap gap-2">
          {[
            { value: "draft", label: "Draft", icon: Clock },
            { value: "published", label: "Published", icon: CheckCircle2 },
            { value: "scheduled", label: "Scheduled", icon: CalendarIcon },
            { value: "archived", label: "Archived", icon: Archive },
          ].map(({ value, label, icon: Icon }) => (
            <Badge
              key={value}
              variant={filters.status?.includes(value as ArticleStatus) ? "default" : "outline"}
              className="cursor-pointer hover:bg-primary/80"
              onClick={() =>
                onFiltersChange({
                  status: toggleArrayFilterValue(filters.status, value as ArticleStatus),
                })
              }
            >
              <Icon className="h-3 w-3 mr-1" />
              {label}
            </Badge>
          ))}
        </div>
      </div>

      {/* Authors */}
      <div>
        <Label className="text-sm font-medium mb-2 block">Authors</Label>
        <Select
          value={filters.author?.[0] || ""}
          onValueChange={(value) => onFiltersChange({ author: value ? [value] : [] })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select author" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Authors</SelectItem>
            <SelectItem value="john-doe">John Doe</SelectItem>
            <SelectItem value="jane-smith">Jane Smith</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Date Range */}
      <div>
        <Label className="text-sm font-medium mb-2 block">Published Date</Label>
        <div className="grid grid-cols-2 gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.dateRange?.start
                  ? format(filters.dateRange.start, "MMM dd, yyyy")
                  : "Start date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={filters.dateRange?.start}
                onSelect={(date) =>
                  onFiltersChange({
                    dateRange: {
                      ...filters.dateRange,
                      // Deselection passes undefined through, as the original loose typing did
                      start: date as Date,
                    } as NonNullable<FiltersControlProps["filters"]["dateRange"]>,
                  })
                }
              />
            </PopoverContent>
          </Popover>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.dateRange?.end
                  ? format(filters.dateRange.end, "MMM dd, yyyy")
                  : "End date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={filters.dateRange?.end}
                onSelect={(date) =>
                  onFiltersChange({
                    dateRange: {
                      ...filters.dateRange,
                      // Deselection passes undefined through, as the original loose typing did
                      end: date as Date,
                    } as NonNullable<FiltersControlProps["filters"]["dateRange"]>,
                  })
                }
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </>
  );
}
