"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Folder,
  CheckCircle,
  PauseCircle,
  Archive,
  TrendingUp,
  Globe,
  Building,
  Users,
  FileText,
  Megaphone,
  Book,
  Calendar,
  MessageSquare,
  Briefcase,
  FolderOpen,
} from "lucide-react";
import {
  CategoryStatistics,
  CATEGORY_TYPE_DISPLAY,
  CATEGORY_STATUS_DISPLAY,
  CATEGORY_SCOPE_DISPLAY,
} from "@/types/category.types";
import { cn } from "@/lib/utils";

interface CategoriesOverviewCardsProps {
  statistics: CategoryStatistics;
}

export function CategoriesOverviewCards({ statistics }: CategoriesOverviewCardsProps) {
  const getTypeIcon = (type: string) => {
    const iconMap = {
      content: FileText,
      article: FileText,
      announcement: Megaphone,
      publication: Book,
      event: Calendar,
      forum: MessageSquare,
      job: Briefcase,
      resource: Folder,
    };
    return iconMap[type as keyof typeof iconMap] || Folder;
  };

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return CheckCircle;
      case "inactive":
        return PauseCircle;
      case "archived":
        return Archive;
      default:
        return CheckCircle;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "text-emerald-600";
      case "inactive":
        return "text-amber-600";
      case "archived":
        return "text-slate-600";
      default:
        return "text-emerald-600";
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {/* Total Categories */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Categories</CardTitle>
          <Folder className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {new Intl.NumberFormat("en-US").format(statistics.totalCategories)}
          </div>
          <p className="text-xs text-muted-foreground">Across all types and scopes</p>
        </CardContent>
      </Card>

      {/* Active Categories */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active</CardTitle>
          <CheckCircle className="h-4 w-4 text-emerald-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-emerald-600">
            {new Intl.NumberFormat("en-US").format(statistics.activeCategories)}
          </div>
          <p className="text-xs text-muted-foreground">
            {Math.round((statistics.activeCategories / statistics.totalCategories) * 100)}% of total
          </p>
        </CardContent>
      </Card>

      {/* Inactive Categories */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Inactive</CardTitle>
          <PauseCircle className="h-4 w-4 text-amber-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-amber-600">
            {new Intl.NumberFormat("en-US").format(statistics.inactiveCategories)}
          </div>
          <p className="text-xs text-muted-foreground">Temporarily disabled</p>
        </CardContent>
      </Card>

      {/* Archived Categories */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Archived</CardTitle>
          <Archive className="h-4 w-4 text-slate-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-600">
            {new Intl.NumberFormat("en-US").format(statistics.archivedCategories)}
          </div>
          <p className="text-xs text-muted-foreground">No longer in use</p>
        </CardContent>
      </Card>
    </div>
  );
}

interface CategoriesBreakdownProps {
  statistics: CategoryStatistics;
}

export function CategoriesBreakdown({ statistics }: CategoriesBreakdownProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* By Type */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Categories by Type</CardTitle>
          <CardDescription>Distribution across content types</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {statistics.categoriesByType.map((typeStat) => {
            const TypeIcon = getTypeIcon(typeStat.type);
            const typeDisplay = CATEGORY_TYPE_DISPLAY[typeStat.type];

            return (
              <div
                key={typeStat.type}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted">
                    <TypeIcon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">{typeDisplay.name}</p>
                    <p className="text-xs text-muted-foreground">{typeStat.contentCount} items</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">
                    {new Intl.NumberFormat("en-US").format(typeStat.count)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {Math.round((typeStat.count / statistics.totalCategories) * 100)}%
                  </p>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* By Scope */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Categories by Scope</CardTitle>
          <CardDescription>Distribution across access scopes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {statistics.categoriesByScope.map((scopeStat) => {
            const ScopeIcon = (() => {
              switch (scopeStat.scope) {
                case "global":
                  return Globe;
                case "chapter":
                  return Building;
                case "committee":
                  return Users;
                default:
                  return Globe;
              }
            })();
            const scopeDisplay = CATEGORY_SCOPE_DISPLAY[scopeStat.scope];

            return (
              <div
                key={scopeStat.scope}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted">
                    <ScopeIcon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">{scopeDisplay.name}</p>
                    <p className="text-xs text-muted-foreground">{scopeDisplay.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">
                    {new Intl.NumberFormat("en-US").format(scopeStat.count)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {Math.round((scopeStat.count / statistics.totalCategories) * 100)}%
                  </p>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

interface CategoriesStatusBreakdownProps {
  statistics: CategoryStatistics;
}

export function CategoriesStatusBreakdown({ statistics }: CategoriesStatusBreakdownProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Status Overview</CardTitle>
        <CardDescription>Current status distribution</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {statistics.categoriesByStatus.map((statusStat) => {
          const StatusIcon = (() => {
            switch (statusStat.status) {
              case "active":
                return CheckCircle;
              case "inactive":
                return PauseCircle;
              case "archived":
                return Archive;
              default:
                return CheckCircle;
            }
          })();
          const statusDisplay = CATEGORY_STATUS_DISPLAY[statusStat.status];
          const percentage = (statusStat.count / statistics.totalCategories) * 100;
          const getStatusColor = (status: string) => {
            switch (status) {
              case "active":
                return "text-emerald-600";
              case "inactive":
                return "text-amber-600";
              case "archived":
                return "text-slate-600";
              default:
                return "text-emerald-600";
            }
          };

          return (
            <div key={statusStat.status} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <StatusIcon className={cn("h-4 w-4", getStatusColor(statusStat.status))} />
                  <span className="font-medium">{statusDisplay.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold">
                    {new Intl.NumberFormat("en-US").format(statusStat.count)}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {percentage.toFixed(1)}%
                  </Badge>
                </div>
              </div>
              <Progress value={percentage} className="h-2" />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

interface MostUsedCategoriesProps {
  categories: Array<{
    categoryId: string;
    name: string;
    contentCount: number;
    type: string;
    lastUsed: Date;
  }>;
}

export function MostUsedCategories({ categories }: MostUsedCategoriesProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Most Used Categories
        </CardTitle>
        <CardDescription>Categories with the most content items</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {categories.map((category, index) => {
          const TypeIcon = getTypeIcon(category.type);

          return (
            <div
              key={category.categoryId}
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted">
                  <span className="text-sm font-bold text-muted-foreground">{index + 1}</span>
                </div>
                <div>
                  <p className="font-medium">{category.name}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <TypeIcon className="h-3 w-3" />
                    <span>{category.type}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold">
                  {new Intl.NumberFormat("en-US").format(category.contentCount)}
                </p>
                <p className="text-xs text-muted-foreground">items</p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

// Helper function to get type icon
function getTypeIcon(type: string) {
  const iconMap = {
    content: FileText,
    article: FileText,
    announcement: Megaphone,
    publication: Book,
    event: Calendar,
    forum: MessageSquare,
    job: Briefcase,
    resource: FolderOpen,
  };
  return iconMap[type as keyof typeof iconMap] || Folder;
}
