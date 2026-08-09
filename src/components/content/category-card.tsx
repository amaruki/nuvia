"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  Edit,
  Trash2,
  Copy,
  Eye,
  Archive,
  Power,
  Users,
  Building,
  Globe,
  Calendar,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import {
  Category,
  CATEGORY_TYPE_DISPLAY,
  CATEGORY_STATUS_DISPLAY,
  CATEGORY_SCOPE_DISPLAY,
} from "@/types/category.types";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface CategoryCardProps {
  category: Category;
  onView?: (category: Category) => void;
  onEdit?: (category: Category) => void;
  onDelete?: (category: Category) => void;
  onDuplicate?: (category: Category) => void;
  onStatusChange?: (category: Category, status: "active" | "inactive" | "archived") => void;
  selected?: boolean;
  onSelect?: (category: Category, selected: boolean) => void;
}

export function CategoryCard({
  category,
  onView,
  onEdit,
  onDelete,
  onDuplicate,
  onStatusChange,
  selected = false,
  onSelect,
}: CategoryCardProps) {
  const [imageError, setImageError] = useState(false);

  const typeDisplay = CATEGORY_TYPE_DISPLAY[category.type];
  const statusDisplay = CATEGORY_STATUS_DISPLAY[category.status];
  const scopeDisplay = CATEGORY_SCOPE_DISPLAY[category.scope];

  const getScopeIcon = (scope: string) => {
    switch (scope) {
      case "global":
        return Globe;
      case "chapter":
        return Building;
      case "committee":
        return Users;
      default:
        return Globe;
    }
  };

  const getUsageTrend = () => {
    // Mock trend calculation - in real app this would come from analytics
    const trends = ["up", "down", "stable"] as const;
    const trend = trends[Math.floor(Math.random() * trends.length)];
    const percentage = Math.floor(Math.random() * 20) + 1;

    return { trend, percentage };
  };

  const usageTrend = getUsageTrend();
  const TrendIcon =
    usageTrend.trend === "up" ? TrendingUp : usageTrend.trend === "down" ? TrendingDown : Minus;

  const handleStatusToggle = () => {
    const newStatus = category.status === "active" ? "inactive" : "active";
    onStatusChange?.(category, newStatus);
  };

  return (
    <Card
      className={cn(
        "relative transition-all duration-200 hover:shadow-md",
        selected && "ring-2 ring-primary ring-offset-2",
        category.status === "inactive" && "opacity-75",
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Category Icon/Color */}
            <div className="flex-shrink-0">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-semibold"
                style={{ backgroundColor: category.color }}
              >
                {category.emoji || (
                  <div className="w-6 h-6 rounded bg-white/20 flex items-center justify-center">
                    {typeDisplay.icon && (
                      <div
                        className="w-4 h-4 text-current"
                        dangerouslySetInnerHTML={{
                          __html: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                          <path d="M2 17l10 5 10-5"/>
                          <path d="M2 12l10 5 10-5"/>
                        </svg>`,
                        }}
                      />
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Category Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <CardTitle className="text-lg truncate">{category.name}</CardTitle>
                {category.contentCount && category.contentCount > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {category.contentCount}
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="outline" className="text-xs">
                  {typeDisplay.name}
                </Badge>
                <div className="flex items-center gap-1">
                  {React.createElement(getScopeIcon(category.scope), { className: "h-3 w-3" })}
                  <span className="text-xs">{scopeDisplay.name}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            {onSelect && (
              <Checkbox
                checked={selected}
                onCheckedChange={(checked) => onSelect(category, checked === true)}
                aria-label={`Select ${category.name} category`}
                className="mr-2"
              />
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onView?.(category)}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit?.(category)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDuplicate?.(category)}>
                  <Copy className="mr-2 h-4 w-4" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleStatusToggle}>
                  <Power className="mr-2 h-4 w-4" />
                  {category.status === "active" ? "Deactivate" : "Activate"}
                </DropdownMenuItem>
                {category.status !== "archived" && (
                  <DropdownMenuItem onClick={() => onStatusChange?.(category, "archived")}>
                    <Archive className="mr-2 h-4 w-4" />
                    Archive
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDelete?.(category)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {category.description && (
          <CardDescription className="mb-3 line-clamp-2">{category.description}</CardDescription>
        )}

        {/* Status and Stats */}
        <div className="flex items-center justify-between mb-3">
          <Badge variant={statusDisplay.badgeVariant} className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-current" />
            {statusDisplay.name}
          </Badge>

          {category.contentCount !== undefined && (
            <div className="flex items-center gap-1 text-sm">
              <TrendIcon
                className={cn(
                  "h-3 w-3",
                  usageTrend.trend === "up" && "text-green-600",
                  usageTrend.trend === "down" && "text-red-600",
                  usageTrend.trend === "stable" && "text-muted-foreground",
                )}
              />
              <span
                className={cn(
                  usageTrend.trend === "up" && "text-green-600",
                  usageTrend.trend === "down" && "text-red-600",
                  usageTrend.trend === "stable" && "text-muted-foreground",
                )}
              >
                {usageTrend.percentage}%
              </span>
            </div>
          )}
        </div>

        {/* Usage Info */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-muted flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-muted-foreground" />
            </div>
            <div>
              <p className="font-medium">{category.contentCount || 0}</p>
              <p className="text-xs text-muted-foreground">Items</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="font-medium">
                {category.lastUsed
                  ? formatDistanceToNow(category.lastUsed, { addSuffix: true })
                  : "Never"}
              </p>
              <p className="text-xs text-muted-foreground">Last used</p>
            </div>
          </div>
        </div>

        {/* Access Control */}
        {(category.allowedChapters?.length || category.allowedCommittees?.length) && (
          <div className="mt-3 pt-3 border-t">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Users className="h-3 w-3" />
              <span>
                Limited access
                {category.allowedChapters?.length &&
                  ` (${category.allowedChapters.length} chapters)`}
                {category.allowedCommittees?.length &&
                  ` (${category.allowedCommittees.length} committees)`}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
