"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";
import { BudgetCategory } from "@/types/finance.types";

interface BudgetCategoryCardProps {
  category: BudgetCategory;
  onViewDetails?: (category: BudgetCategory) => void;
  onEdit?: (category: BudgetCategory) => void;
}

export function BudgetCategoryCard({ category, onViewDetails, onEdit }: BudgetCategoryCardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "over-budget":
        return "text-destructive";
      case "warning":
        return "text-yellow-600";
      default:
        return "text-green-600";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "over-budget":
        return { variant: "destructive" as const, text: "Over Budget", icon: AlertTriangle };
      case "warning":
        return { variant: "secondary" as const, text: "Warning", icon: TrendingDown };
      default:
        return { variant: "default" as const, text: "On Track", icon: TrendingUp };
    }
  };

  const statusBadge = getStatusBadge(category.status);
  const StatusIcon = statusBadge.icon;

  return (
    <Card className="relative">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }} />
            <CardTitle className="text-lg">{category.name}</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={statusBadge.variant} className="flex items-center gap-1">
              <StatusIcon className="h-3 w-3" />
              {statusBadge.text}
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onEdit?.(category)}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {category.description && <CardDescription>{category.description}</CardDescription>}
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Budget Usage</span>
            <span className={`font-medium ${getStatusColor(category.status)}`}>
              {category.percentageUsed.toFixed(1)}%
            </span>
          </div>
          <Progress value={Math.min(category.percentageUsed, 100)} className="h-2" />
        </div>

        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Allocated</p>
            <p className="font-semibold">{formatCurrency(category.allocatedAmount)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Spent</p>
            <p className="font-semibold">{formatCurrency(category.spentAmount)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Remaining</p>
            <p className={`font-semibold ${getStatusColor(category.status)}`}>
              {formatCurrency(category.remainingAmount)}
            </p>
          </div>
        </div>

        {category.subcategories && category.subcategories.length > 0 && (
          <div className="flex flex-col space-y-2 gap-2">
            <p className="text-sm font-medium text-muted-foreground">Subcategories</p>
            <div className="space-y-2">
              {category.subcategories.slice(0, 3).map((subcategory) => (
                <div key={subcategory.id} className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{subcategory.name}</span>
                  <span>
                    {formatCurrency(subcategory.spentAmount)} /{" "}
                    {formatCurrency(subcategory.allocatedAmount)}
                  </span>
                </div>
              ))}
              {category.subcategories.length > 3 && (
                <p className="text-xs text-muted-foreground">
                  +{category.subcategories.length - 3} more subcategories
                </p>
              )}
            </div>
          </div>
        )}

        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => onViewDetails?.(category)}
        >
          View Details
        </Button>
      </CardContent>
    </Card>
  );
}
