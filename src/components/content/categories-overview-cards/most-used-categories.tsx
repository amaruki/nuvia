"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import type { MostUsedCategoriesProps } from "./types";
import { formatNumber, getTypeIcon } from "./helpers";

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
                <p className="text-lg font-bold">{formatNumber(category.contentCount)}</p>
                <p className="text-xs text-muted-foreground">items</p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
