import { TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { DueStatistics } from "@/types/finance";
import { formatCurrency } from "./helpers";

interface CollectionTrendCardProps {
  statistics: DueStatistics;
}

export function CollectionTrendCard({ statistics }: CollectionTrendCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Collection Trend</CardTitle>
        <CardDescription>Monthly collection performance</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {statistics.monthlyTrend.map((month, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{month.month}</span>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">{formatCurrency(month.collected)}</p>
                <p className="text-xs text-muted-foreground">of {formatCurrency(month.amount)}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
