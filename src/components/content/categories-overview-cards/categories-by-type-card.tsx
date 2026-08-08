"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CATEGORY_TYPE_DISPLAY } from "@/types/category.types";
import type { CategoryStatisticsCardProps } from "./types";
import { formatNumber, getTypeIcon } from "./helpers";

export function CategoriesByTypeCard({ statistics }: CategoryStatisticsCardProps) {
  return (
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
                <p className="text-lg font-bold">{formatNumber(typeStat.count)}</p>
                <p className="text-xs text-muted-foreground">
                  {Math.round((typeStat.count / statistics.totalCategories) * 100)}%
                </p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
