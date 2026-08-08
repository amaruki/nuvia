/**
 * Permission Legend
 *
 * Summary legend for the matrix: granted vs denied counts,
 * total permissions, and overall access level for the role.
 */

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PermissionLegendProps {
  grantedCount: number;
  totalCount: number;
}

export function PermissionLegend({ grantedCount, totalCount }: PermissionLegendProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Permission Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <div className="text-2xl font-bold text-green-600">{grantedCount}</div>
            <div className="text-sm text-muted-foreground">Granted Permissions</div>
          </div>
          <div className="space-y-2">
            <div className="text-2xl font-bold text-muted-foreground">
              {totalCount - grantedCount}
            </div>
            <div className="text-sm text-muted-foreground">Denied Permissions</div>
          </div>
          <div className="space-y-2">
            <div className="text-2xl font-bold">{totalCount}</div>
            <div className="text-sm text-muted-foreground">Total Permissions</div>
          </div>
          <div className="space-y-2">
            <div className="text-2xl font-bold">
              {Math.round((grantedCount / totalCount) * 100)}%
            </div>
            <div className="text-sm text-muted-foreground">Access Level</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
