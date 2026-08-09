"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getCategoryIcon } from "./helpers";
import type { CategoryBreakdownEntry, RoleStatisticsSectionProps } from "./types";

export function CategoryBreakdownCard({ data }: RoleStatisticsSectionProps) {
  const { totalUsers, roleBreakdown } = data;

  const categoryBreakdown = roleBreakdown.reduce(
    (acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = { count: 0, roles: [] };
      }
      acc[item.category].count += item.count;
      acc[item.category].roles.push(item);
      return acc;
    },
    {} as Record<string, CategoryBreakdownEntry>,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Category Breakdown</CardTitle>
        <CardDescription>User distribution by role category</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Object.entries(categoryBreakdown).map(([category, entry]) => {
            const percentage = Math.round((entry.count / totalUsers) * 100);

            return (
              <div key={category} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getCategoryIcon(category)}
                    <span className="font-medium capitalize">{category}</span>
                    <Badge variant="outline">{entry.roles.length} roles</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {entry.count} users ({percentage}%)
                  </div>
                </div>
                <Progress value={percentage} className="h-2" />
                <div className="flex flex-wrap gap-1">
                  {entry.roles.map((role) => (
                    <Badge key={role.role} variant="outline" className="text-xs">
                      {role.displayName} ({role.count})
                    </Badge>
                  ))}
                </div>
                {category !==
                  Object.keys(categoryBreakdown)[Object.keys(categoryBreakdown).length - 1] && (
                  <div className="border-t pt-2" />
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
