"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BookOpen } from "lucide-react";
import type { PublicationStatisticsCardProps } from "./types";
import { formatNumber, formatPercentage } from "./helpers";

export function PublicationTypesCard({ statistics }: PublicationStatisticsCardProps) {
  return (
    <Card className="shadow-sm col-span-1 lg:col-span-2">
      <CardHeader>
        <CardTitle className="text-base">Publication Types</CardTitle>
        <CardDescription>Distribution by publication type</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {statistics.publicationsByType
            .sort((a, b) => b.count - a.count)
            .slice(0, 4)
            .map((type) => (
              <div
                key={type.type}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <BookOpen className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium capitalize">{type.type.replace("_", " ")}</p>
                    <p className="text-xs text-muted-foreground">{type.count} publications</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold">{formatNumber(type.views)}</span>
                  <p className="text-xs text-muted-foreground">
                    {formatPercentage(type.engagement)} engagement
                  </p>
                </div>
              </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
}
