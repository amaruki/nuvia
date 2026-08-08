"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CATEGORY_SCOPE_DISPLAY } from "@/types/category.types";
import type { CategoryStatisticsCardProps } from "./types";
import { formatNumber, getScopeIcon } from "./helpers";

export function CategoriesByScopeCard({ statistics }: CategoryStatisticsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Categories by Scope</CardTitle>
        <CardDescription>Distribution across access scopes</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {statistics.categoriesByScope.map((scopeStat) => {
          const ScopeIcon = getScopeIcon(scopeStat.scope);
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
                <p className="text-lg font-bold">{formatNumber(scopeStat.count)}</p>
                <p className="text-xs text-muted-foreground">
                  {Math.round((scopeStat.count / statistics.totalCategories) * 100)}%
                </p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
