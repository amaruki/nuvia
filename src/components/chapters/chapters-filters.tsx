"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  ChapterFilterOptions,
  ChapterStatus,
  ChapterRole
} from "@/types/chapter.types";
import { 
  Filter,
  X,
  ChevronDown,
  ChevronUp,
  Search,
  Users,
  MapPin,
  Shield,
  UserCheck
} from "lucide-react";

interface ChaptersFiltersProps {
  filters: ChapterFilterOptions;
  onFiltersChange: (filters: Partial<ChapterFilterOptions>) => void;
  onClearFilters: () => void;
}

const statusOptions: { value: ChapterStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "pending", label: "Pending" },
  { value: "suspended", label: "Suspended" },
];

const regionOptions = [
  { value: "Northeast", label: "Northeast" },
  { value: "Southeast", label: "Southeast" },
  { value: "Midwest", label: "Midwest" },
  { value: "West", label: "West" },
  { value: "Southwest", label: "Southwest" },
];

const countryOptions = [
  { value: "United States", label: "United States" },
  { value: "Canada", label: "Canada" },
  { value: "United Kingdom", label: "United Kingdom" },
  { value: "Australia", label: "Australia" },
];

const leadershipRoleOptions: { value: ChapterRole; label: string }[] = [
  { value: "president", label: "President" },
  { value: "vice_president", label: "Vice President" },
  { value: "secretary", label: "Secretary" },
  { value: "treasurer", label: "Treasurer" },
  { value: "admin", label: "Admin" },
  { value: "member", label: "Member" },
];

const memberCountRanges = [
  { value: { min: 0, max: 50 }, label: "0-50 members" },
  { value: { min: 51, max: 100 }, label: "51-100 members" },
  { value: { min: 101, max: 200 }, label: "101-200 members" },
  { value: { min: 201, max: 500 }, label: "201-500 members" },
  { value: { min: 501, max: 1000 }, label: "501-1000 members" },
  { value: { min: 1001, max: 9999 }, label: "1000+ members" },
];

export function ChaptersFilters({
  filters,
  onFiltersChange,
  onClearFilters,
}: ChaptersFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const handleStatusChange = (status: ChapterStatus, checked: boolean) => {
    const currentStatuses = filters.status || [];
    const newStatuses = checked
      ? [...currentStatuses, status]
      : currentStatuses.filter(s => s !== status);
    
    onFiltersChange({ status: newStatuses.length > 0 ? newStatuses : undefined });
  };

  const handleRegionChange = (region: string, checked: boolean) => {
    const currentRegions = filters.region || [];
    const newRegions = checked
      ? [...currentRegions, region]
      : currentRegions.filter(r => r !== region);
    
    onFiltersChange({ region: newRegions.length > 0 ? newRegions : undefined });
  };

  const handleCountryChange = (country: string, checked: boolean) => {
    const currentCountries = filters.country || [];
    const newCountries = checked
      ? [...currentCountries, country]
      : currentCountries.filter(c => c !== country);
    
    onFiltersChange({ country: newCountries.length > 0 ? newCountries : undefined });
  };

  const handleLeadershipRoleChange = (role: ChapterRole, checked: boolean) => {
    const currentRoles = filters.leadershipRole || [];
    const newRoles = checked
      ? [...currentRoles, role]
      : currentRoles.filter(r => r !== role);
    
    onFiltersChange({ leadershipRole: newRoles.length > 0 ? newRoles : undefined });
  };

  const handleMemberCountRangeChange = (range: { min: number; max: number }) => {
    onFiltersChange({ memberCountRange: range });
  };

  const handleSearchChange = (value: string) => {
    onFiltersChange({ search: value || undefined });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.status?.length) count++;
    if (filters.region?.length) count++;
    if (filters.country?.length) count++;
    if (filters.leadershipRole?.length) count++;
    if (filters.memberCountRange) count++;
    if (filters.search) count++;
    return count;
  };

  const hasActiveFilters = getActiveFiltersCount() > 0;

  return (
    <Card className="shadow-sm">
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <CardHeader className="pb-3 cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filters
                {hasActiveFilters && (
                  <Badge variant="secondary" className="text-xs">
                    {getActiveFiltersCount()}
                  </Badge>
                )}
              </CardTitle>
              <Button variant="ghost" size="sm">
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="space-y-6 pt-0">
            {/* Search */}
            <div className="space-y-2">
              <Label htmlFor="search" className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                Search
              </Label>
              <Input
                id="search"
                placeholder="Search by name, location, or description..."
                value={filters.search || ""}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full"
              />
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* Status Filter */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Status
                </Label>
                <div className="space-y-2">
                  {statusOptions.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`status-${option.value}`}
                        checked={filters.status?.includes(option.value) || false}
                        onCheckedChange={(checked) => handleStatusChange(option.value, checked as boolean)}
                      />
                      <Label htmlFor={`status-${option.value}`} className="text-sm font-normal">
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Region Filter */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Region
                </Label>
                <div className="space-y-2">
                  {regionOptions.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`region-${option.value}`}
                        checked={filters.region?.includes(option.value) || false}
                        onCheckedChange={(checked) => handleRegionChange(option.value, checked as boolean)}
                      />
                      <Label htmlFor={`region-${option.value}`} className="text-sm font-normal">
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Country Filter */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Country
                </Label>
                <div className="space-y-2">
                  {countryOptions.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`country-${option.value}`}
                        checked={filters.country?.includes(option.value) || false}
                        onCheckedChange={(checked) => handleCountryChange(option.value, checked as boolean)}
                      />
                      <Label htmlFor={`country-${option.value}`} className="text-sm font-normal">
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Leadership Role Filter */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4" />
                  Leadership Role
                </Label>
                <div className="space-y-2">
                  {leadershipRoleOptions.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`role-${option.value}`}
                        checked={filters.leadershipRole?.includes(option.value) || false}
                        onCheckedChange={(checked) => handleLeadershipRoleChange(option.value, checked as boolean)}
                      />
                      <Label htmlFor={`role-${option.value}`} className="text-sm font-normal">
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Member Count Range Filter */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Member Count
                </Label>
                <Select
                  value={filters.memberCountRange ? `${filters.memberCountRange.min}-${filters.memberCountRange.max}` : ""}
                  onValueChange={(value) => {
                    const [min, max] = value.split('-').map(Number);
                    handleMemberCountRangeChange({ min, max });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select member count range" />
                  </SelectTrigger>
                  <SelectContent>
                    {memberCountRanges.map((option) => (
                      <SelectItem key={`${option.value.min}-${option.value.max}`} value={`${option.value.min}-${option.value.max}`}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Filter Actions */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                {hasActiveFilters && (
                  <span>{getActiveFiltersCount()} filter{getActiveFiltersCount() !== 1 ? 's' : ''} applied</span>
                )}
              </div>
              <div className="flex gap-2">
                {hasActiveFilters && (
                  <Button variant="outline" size="sm" onClick={onClearFilters}>
                    <X className="mr-2 h-4 w-4" />
                    Clear All
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}