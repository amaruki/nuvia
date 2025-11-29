"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, DollarSign, BarChart3 } from "lucide-react";
import { BudgetAnalytics } from "@/types/finance.types";

interface BudgetAnalyticsProps {
  analytics: BudgetAnalytics;
}

export function BudgetAnalyticsComponent({ analytics }: BudgetAnalyticsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getVarianceColor = (variance: number) => {
    if (variance < 0) return 'text-destructive';
    if (variance < 10) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getVarianceBadge = (variance: number) => {
    if (variance < -10) return { variant: 'destructive' as const, text: 'Over Budget' };
    if (variance < 0) return { variant: 'secondary' as const, text: 'Slightly Over' };
    if (variance < 10) return { variant: 'outline' as const, text: 'On Track' };
    return { variant: 'default' as const, text: 'Under Budget' };
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Monthly Spend</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(
                analytics.spendingTrends.reduce((sum, trend) => sum + trend.amount, 0) / 
                analytics.spendingTrends.filter(t => t.amount > 0).length || 0
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Last 6 months average
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budget Variance</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatPercentage(
                analytics.varianceAnalysis.reduce((sum, v) => sum + v.variancePercentage, 0) / 
                analytics.varianceAnalysis.length || 0
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Average variance across categories
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Category</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.categoryBreakdown[0]?.category || 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatPercentage(analytics.categoryBreakdown[0]?.percentage || 0)} of total spend
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">YoY Change</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(() => {
                const currentYear = analytics.monthlyComparison.reduce((sum, m) => sum + m.currentYear, 0);
                const previousYear = analytics.monthlyComparison.reduce((sum, m) => sum + m.previousYear, 0);
                const change = ((currentYear - previousYear) / previousYear) * 100;
                return formatPercentage(change);
              })()}
            </div>
            <p className="text-xs text-muted-foreground">
              Year over year comparison
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Spending Trends</CardTitle>
            <CardDescription>Monthly spending vs budget over the last 6 months</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {analytics.spendingTrends.map((trend, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{trend.month}</span>
                  <span>{formatCurrency(trend.amount)} / {formatCurrency(trend.budget)}</span>
                </div>
                <div className="space-y-1">
                  <Progress 
                    value={(trend.amount / trend.budget) * 100} 
                    className="h-2"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{formatPercentage((trend.amount / trend.budget) * 100)} used</span>
                    <span>{formatCurrency(trend.budget - trend.amount)} remaining</span>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Category Breakdown</CardTitle>
            <CardDescription>Spending distribution by category</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {analytics.categoryBreakdown.map((category, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{category.category}</span>
                  <span>{formatCurrency(category.amount)} ({formatPercentage(category.percentage)})</span>
                </div>
                <Progress value={category.percentage} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Variance Analysis</CardTitle>
          <CardDescription>Budget vs actual spending by category</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.varianceAnalysis.map((variance, index) => {
              const badge = getVarianceBadge(variance.variancePercentage);
              return (
                <div key={index} className="grid grid-cols-5 items-center gap-4 p-3 border rounded-lg">
                  <div className="font-medium">{variance.category}</div>
                  <div className="text-right">
                    <div className="text-sm">{formatCurrency(variance.budgeted)}</div>
                    <div className="text-xs text-muted-foreground">Budgeted</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm">{formatCurrency(variance.actual)}</div>
                    <div className="text-xs text-muted-foreground">Actual</div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-medium ${getVarianceColor(variance.variance)}`}>
                      {variance.variance > 0 ? '+' : ''}{formatCurrency(variance.variance)}
                    </div>
                    <div className="text-xs text-muted-foreground">Variance</div>
                  </div>
                  <div className="flex justify-end">
                    <Badge variant={badge.variant}>{badge.text}</Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Monthly Comparison</CardTitle>
          <CardDescription>Year-over-year monthly spending comparison</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.monthlyComparison.map((month, index) => {
              const change = ((month.currentYear - month.previousYear) / month.previousYear) * 100;
              const isPositive = change >= 0;
              
              return (
                <div key={index} className="grid grid-cols-4 items-center gap-4 p-3 border rounded-lg">
                  <div className="font-medium">{month.month}</div>
                  <div className="text-right">
                    <div className="text-sm">{formatCurrency(month.previousYear)}</div>
                    <div className="text-xs text-muted-foreground">Previous Year</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm">{formatCurrency(month.currentYear)}</div>
                    <div className="text-xs text-muted-foreground">Current Year</div>
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    {isPositive ? (
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-600" />
                    )}
                    <span className={`text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                      {isPositive ? '+' : ''}{formatPercentage(change)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}