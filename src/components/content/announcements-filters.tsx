"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  AnnouncementFilters,
  AnnouncementType,
  AnnouncementPriority,
  AnnouncementTargetAudience,
  ANNOUNCEMENT_TYPES,
  ANNOUNCEMENT_PRIORITIES,
  ANNOUNCEMENT_TARGET_AUDIENCES,
  ANNOUNCEMENT_TYPE_DISPLAY,
  ANNOUNCEMENT_PRIORITY_DISPLAY,
  ANNOUNCEMENT_TARGET_AUDIENCE_DISPLAY,
} from "@/types/announcement.types";
import { ArticleStatus } from "@/types/article.types";
import { format } from "date-fns";
import {
  Search,
  Filter,
  X,
  Calendar as CalendarIcon,
  ChevronDown,
  ChevronUp,
  Users,
  Bell,
  AlertTriangle,
  Star,
  Clock,
  Archive,
  CheckCircle2,
  Target,
  Shield,
  Gift,
  Zap,
  Megaphone,
  Pin,
  Eye,
  Mail,
  Smartphone,
  Home,
  Layout,
} from "lucide-react";

interface AnnouncementsFiltersProps {
  filters: AnnouncementFilters;
  onFiltersChange: (filters: AnnouncementFilters) => void;
  onReset: () => void;
}

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

  const updateFilter = (key: keyof AnnouncementFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const addArrayFilter = (key: keyof AnnouncementFilters, value: string) => {
    const currentArray = (filters[key] as string[]) || [];
    const newArray = currentArray.includes(value)
      ? currentArray.filter((item) => item !== value)
      : [...currentArray, value];
    updateFilter(key, newArray);
  };

  const removeArrayFilter = (key: keyof AnnouncementFilters, value: string) => {
    const currentArray = (filters[key] as string[]) || [];
    updateFilter(
      key,
      currentArray.filter((item) => item !== value),
    );
  };

  const clearAllFilters = () => {
    onReset();
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.status?.length) count++;
    if (filters.type?.length) count++;
    if (filters.priority?.length) count++;
    if (filters.targetAudience?.length) count++;
    if (filters.author?.length) count++;
    if (filters.tags?.length) count++;
    if (filters.dateRange) count++;
    if (filters.expiresAt) count++;
    if (filters.isPinned !== undefined) count++;
    if (filters.isUrgent !== undefined) count++;
    if (filters.requiresAcknowledgment !== undefined) count++;
    if (filters.hasExpiration !== undefined) count++;
    if (filters.sendEmailNotification !== undefined) count++;
    if (filters.sendPushNotification !== undefined) count++;
    if (filters.displayOnHomepage !== undefined) count++;
    if (filters.displayInDashboard !== undefined) count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

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
              onChange={(e) => updateFilter("search", e.target.value)}
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
                      variant={
                        filters.status?.includes(value as ArticleStatus) ? "default" : "outline"
                      }
                      className="cursor-pointer hover:bg-primary/80"
                      onClick={() => addArrayFilter("status", value)}
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
                  onValueChange={(value) => updateFilter("author", value ? [value] : [])}
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
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
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
                          updateFilter("dateRange", {
                            ...filters.dateRange,
                            start: date,
                          })
                        }
                        autoFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
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
                          updateFilter("dateRange", {
                            ...filters.dateRange,
                            end: date,
                          })
                        }
                        autoFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
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
              {/* Type */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Type</Label>
                <div className="flex flex-wrap gap-2">
                  {ANNOUNCEMENT_TYPES.map((type) => {
                    const display = ANNOUNCEMENT_TYPE_DISPLAY[type];
                    return (
                      <Badge
                        key={type}
                        variant={filters.type?.includes(type) ? "default" : "outline"}
                        className="cursor-pointer hover:bg-primary/80"
                        onClick={() => addArrayFilter("type", type)}
                      >
                        {display.name}
                      </Badge>
                    );
                  })}
                </div>
              </div>

              {/* Priority */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Priority</Label>
                <div className="flex flex-wrap gap-2">
                  {ANNOUNCEMENT_PRIORITIES.map((priority) => {
                    const display = ANNOUNCEMENT_PRIORITY_DISPLAY[priority];
                    return (
                      <Badge
                        key={priority}
                        variant={
                          filters.priority?.includes(priority) ? display.badgeVariant : "outline"
                        }
                        className="cursor-pointer hover:bg-primary/80"
                        onClick={() => addArrayFilter("priority", priority)}
                      >
                        {display.name}
                      </Badge>
                    );
                  })}
                </div>
              </div>

              {/* Target Audience */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Target Audience</Label>
                <div className="flex flex-wrap gap-2">
                  {ANNOUNCEMENT_TARGET_AUDIENCES.map((audience) => {
                    const display = ANNOUNCEMENT_TARGET_AUDIENCE_DISPLAY[audience];
                    return (
                      <Badge
                        key={audience}
                        variant={filters.targetAudience?.includes(audience) ? "default" : "outline"}
                        className="cursor-pointer hover:bg-primary/80"
                        onClick={() => addArrayFilter("targetAudience", audience)}
                      >
                        {display.name}
                      </Badge>
                    );
                  })}
                </div>
              </div>

              {/* Expiration Date */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Expiration Date</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filters.expiresAt?.start
                          ? format(filters.expiresAt.start, "MMM dd, yyyy")
                          : "Start date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={filters.expiresAt?.start}
                        onSelect={(date) =>
                          updateFilter("expiresAt", {
                            ...filters.expiresAt,
                            start: date,
                          })
                        }
                        autoFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filters.expiresAt?.end
                          ? format(filters.expiresAt.end, "MMM dd, yyyy")
                          : "End date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={filters.expiresAt?.end}
                        onSelect={(date) =>
                          updateFilter("expiresAt", {
                            ...filters.expiresAt,
                            end: date,
                          })
                        }
                        autoFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
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
              {/* Boolean Filters */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="pinned"
                    checked={filters.isPinned === true}
                    onCheckedChange={(checked) =>
                      updateFilter("isPinned", checked === true ? true : undefined)
                    }
                  />
                  <Label htmlFor="pinned" className="text-sm flex items-center gap-2">
                    <Pin className="h-4 w-4" />
                    Pinned announcements
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="urgent"
                    checked={filters.isUrgent === true}
                    onCheckedChange={(checked) =>
                      updateFilter("isUrgent", checked === true ? true : undefined)
                    }
                  />
                  <Label htmlFor="urgent" className="text-sm flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Urgent announcements
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="requires-acknowledgment"
                    checked={filters.requiresAcknowledgment === true}
                    onCheckedChange={(checked) =>
                      updateFilter("requiresAcknowledgment", checked === true ? true : undefined)
                    }
                  />
                  <Label
                    htmlFor="requires-acknowledgment"
                    className="text-sm flex items-center gap-2"
                  >
                    <Target className="h-4 w-4" />
                    Requires acknowledgment
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="has-expiration"
                    checked={filters.hasExpiration === true}
                    onCheckedChange={(checked) =>
                      updateFilter("hasExpiration", checked === true ? true : undefined)
                    }
                  />
                  <Label htmlFor="has-expiration" className="text-sm flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Has expiration date
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="email-notification"
                    checked={filters.sendEmailNotification === true}
                    onCheckedChange={(checked) =>
                      updateFilter("sendEmailNotification", checked === true ? true : undefined)
                    }
                  />
                  <Label htmlFor="email-notification" className="text-sm flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email notification sent
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="push-notification"
                    checked={filters.sendPushNotification === true}
                    onCheckedChange={(checked) =>
                      updateFilter("sendPushNotification", checked === true ? true : undefined)
                    }
                  />
                  <Label htmlFor="push-notification" className="text-sm flex items-center gap-2">
                    <Smartphone className="h-4 w-4" />
                    Push notification sent
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="homepage"
                    checked={filters.displayOnHomepage === true}
                    onCheckedChange={(checked) =>
                      updateFilter("displayOnHomepage", checked === true ? true : undefined)
                    }
                  />
                  <Label htmlFor="homepage" className="text-sm flex items-center gap-2">
                    <Home className="h-4 w-4" />
                    Display on homepage
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="dashboard"
                    checked={filters.displayInDashboard === true}
                    onCheckedChange={(checked) =>
                      updateFilter("displayInDashboard", checked === true ? true : undefined)
                    }
                  />
                  <Label htmlFor="dashboard" className="text-sm flex items-center gap-2">
                    <Layout className="h-4 w-4" />
                    Display in dashboard
                  </Label>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Active Filters Summary */}
          {activeFiltersCount > 0 && (
            <>
              <Separator />
              <div>
                <Label className="text-sm font-medium mb-2 block">Active Filters</Label>
                <div className="flex flex-wrap gap-2">
                  {filters.search && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      Search: {filters.search}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => updateFilter("search", "")}
                      />
                    </Badge>
                  )}
                  {filters.status?.map((status) => (
                    <Badge key={status} variant="secondary" className="flex items-center gap-1">
                      Status: {status}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => removeArrayFilter("status", status)}
                      />
                    </Badge>
                  ))}
                  {filters.type?.map((type) => (
                    <Badge key={type} variant="secondary" className="flex items-center gap-1">
                      Type: {ANNOUNCEMENT_TYPE_DISPLAY[type].name}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => removeArrayFilter("type", type)}
                      />
                    </Badge>
                  ))}
                  {filters.priority?.map((priority) => (
                    <Badge key={priority} variant="secondary" className="flex items-center gap-1">
                      Priority: {ANNOUNCEMENT_PRIORITY_DISPLAY[priority].name}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => removeArrayFilter("priority", priority)}
                      />
                    </Badge>
                  ))}
                  {filters.targetAudience?.map((audience) => (
                    <Badge key={audience} variant="secondary" className="flex items-center gap-1">
                      Audience: {ANNOUNCEMENT_TARGET_AUDIENCE_DISPLAY[audience].name}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => removeArrayFilter("targetAudience", audience)}
                      />
                    </Badge>
                  ))}
                  {filters.author?.map((author) => (
                    <Badge key={author} variant="secondary" className="flex items-center gap-1">
                      Author: {author}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => removeArrayFilter("author", author)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
