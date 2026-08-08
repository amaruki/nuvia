import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { BudgetVsActualData } from "@/types/finance";
import { cn } from "@/lib/utils";
import { formatCurrency } from "./helpers";

interface BudgetVsActualTabProps {
  budgetVsActualData?: BudgetVsActualData | null;
}

export default function BudgetVsActualTab({ budgetVsActualData }: BudgetVsActualTabProps) {
  if (!budgetVsActualData) return null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Budget vs Actual Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>Total Budgeted</span>
              <span className="font-medium">
                {formatCurrency(budgetVsActualData.totalBudgeted)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Total Actual</span>
              <span className="font-medium">{formatCurrency(budgetVsActualData.totalActual)}</span>
            </div>
            <div className="flex justify-between">
              <span>Total Variance</span>
              <span
                className={cn(
                  "font-medium",
                  budgetVsActualData.totalVariance >= 0 ? "text-green-600" : "text-red-600",
                )}
              >
                {formatCurrency(budgetVsActualData.totalVariance)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Variance Percentage</span>
              <span
                className={cn(
                  "font-medium",
                  budgetVsActualData.totalVariancePercentage >= 0
                    ? "text-green-600"
                    : "text-red-600",
                )}
              >
                {budgetVsActualData.totalVariancePercentage.toFixed(1)}%
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="grid gap-4 md:grid-cols-2">
        {budgetVsActualData.categories.map((category) => (
          <Card key={category.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{category.name}</CardTitle>
                <Badge
                  variant={
                    category.status === "under_budget"
                      ? "default"
                      : category.status === "on_track"
                        ? "secondary"
                        : "destructive"
                  }
                >
                  {category.status.replace("_", " ")}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Budgeted</span>
                  <span>{formatCurrency(category.budgeted)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Actual</span>
                  <span>{formatCurrency(category.actual)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Variance</span>
                  <span
                    className={cn(
                      "font-medium",
                      category.variance >= 0 ? "text-green-600" : "text-red-600",
                    )}
                  >
                    {formatCurrency(category.variance)}
                  </span>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Progress</span>
                    <span>{Math.abs(category.variancePercentage).toFixed(1)}%</span>
                  </div>
                  <Progress
                    value={Math.min(Math.abs(category.variancePercentage), 100)}
                    className="h-2"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
