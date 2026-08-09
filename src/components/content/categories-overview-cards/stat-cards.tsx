import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Archive, CheckCircle, Folder, PauseCircle } from "lucide-react";
import type { CategoryStatisticsCardProps } from "./types";
import { formatNumber } from "./helpers";

export function TotalCategoriesCard({ statistics }: CategoryStatisticsCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Total Categories</CardTitle>
        <Folder className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formatNumber(statistics.totalCategories)}</div>
        <p className="text-xs text-muted-foreground">Across all types and scopes</p>
      </CardContent>
    </Card>
  );
}

export function ActiveCategoriesCard({ statistics }: CategoryStatisticsCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Active</CardTitle>
        <CheckCircle className="h-4 w-4 text-emerald-600" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-emerald-600">
          {formatNumber(statistics.activeCategories)}
        </div>
        <p className="text-xs text-muted-foreground">
          {Math.round((statistics.activeCategories / statistics.totalCategories) * 100)}% of total
        </p>
      </CardContent>
    </Card>
  );
}

export function InactiveCategoriesCard({ statistics }: CategoryStatisticsCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Inactive</CardTitle>
        <PauseCircle className="h-4 w-4 text-amber-600" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-amber-600">
          {formatNumber(statistics.inactiveCategories)}
        </div>
        <p className="text-xs text-muted-foreground">Temporarily disabled</p>
      </CardContent>
    </Card>
  );
}

export function ArchivedCategoriesCard({ statistics }: CategoryStatisticsCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Archived</CardTitle>
        <Archive className="h-4 w-4 text-slate-600" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-slate-600">
          {formatNumber(statistics.archivedCategories)}
        </div>
        <p className="text-xs text-muted-foreground">No longer in use</p>
      </CardContent>
    </Card>
  );
}
