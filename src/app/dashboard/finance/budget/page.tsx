"use client";

import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, RefreshCw, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";

import { BudgetOverviewCard } from "@/components/finance/budget-overview-card";
import { BudgetCategoryCard } from "@/components/finance/budget-category-card";
import { BudgetTransactionTable } from "@/components/finance/budget-transaction-table";
import { BudgetForm } from "@/components/finance/budget-form";
import { BudgetAnalyticsComponent } from "@/components/finance/budget-analytics";

import { useBudget } from "@/lib/hooks/use-budget";
import { BudgetCategory, BudgetTransaction, BudgetFormData } from "@/types/finance.types";
import { useSession } from "@/hooks/use-session";
import { useHeader } from "@/contexts/dashboard-context";

export default function FinanceBudget() {
  const [activeTab, setActiveTab] = useState("overview");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<BudgetCategory | null>(null);
  const { user, isPending: status } = useSession();
  const { setHeader, clearHeader } = useHeader();

  const {
    categories,
    periods,
    transactions,
    overview,
    analytics,
    loading,
    error,
    createCategory,
    updateCategory,
    deleteCategory,
    deleteTransaction,
    refreshData,
  } = useBudget();

  const handleCreateCategory = () => {
    setEditingCategory(null);
    setIsFormOpen(true);
  };

  const handleEditCategory = (category: BudgetCategory) => {
    setEditingCategory(category);
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (data: BudgetFormData) => {
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, data);
      } else {
        await createCategory(data);
      }
      await refreshData();
    } catch (err) {
      console.error("Error saving category:", err);
    }
  };

  const handleDeleteTransaction = async (transaction: BudgetTransaction) => {
    try {
      await deleteTransaction(transaction.id);
      await refreshData();
    } catch (err) {
      console.error("Error deleting transaction:", err);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  useEffect(() => {
    // Set the header
    setHeader({
      title: "Budget Management",
      description: "Manage your organization's budget and track expenses",
    });

    // Cleanup header on unmount
    return () => {
      clearHeader();
    };
  }, [setHeader, clearHeader]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-muted rounded w-20"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-32 mb-2"></div>
                <div className="h-3 bg-muted rounded w-24"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button onClick={refreshData}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </div>

        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {overview && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="text-sm">
                Current Period: {periods.find((p) => p.status === "active")?.name || "N/A"}
              </Badge>
              {overview.periodComparison.changePercentage > 0 ? (
                <Badge variant="secondary" className="text-sm">
                  <TrendingUp className="mr-1 h-3 w-3" />+
                  {overview.periodComparison.changePercentage.toFixed(1)}% vs last period
                </Badge>
              ) : (
                <Badge variant="outline" className="text-sm">
                  <TrendingDown className="mr-1 h-3 w-3" />
                  {overview.periodComparison.changePercentage.toFixed(1)}% vs last period
                </Badge>
              )}
            </div>
            <div className="flex items-end justify-end">
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={refreshData}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh
                </Button>
                <Button onClick={handleCreateCategory}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Category
                </Button>
              </div>
            </div>
          </div>

          <BudgetOverviewCard overview={overview} />
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Budget Status</CardTitle>
                <CardDescription>Current budget health and status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Overall Status</span>
                  <Badge
                    variant={(overview?.percentageUsed || 0) >= 90 ? "destructive" : "default"}
                  >
                    {(overview?.percentageUsed || 0) >= 90 ? "Critical" : "Healthy"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Total Budget</span>
                  <span className="font-semibold">
                    {formatCurrency(overview?.totalBudget || 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Total Spent</span>
                  <span className="font-semibold">{formatCurrency(overview?.totalSpent || 0)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Remaining</span>
                  <span className="font-semibold">
                    {formatCurrency(overview?.totalRemaining || 0)}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest budget transactions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {transactions.slice(0, 5).map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{transaction.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {transaction.date.toLocaleDateString()}
                        </p>
                      </div>
                      <span className="text-sm font-medium">
                        {transaction.type === "expense" ? "-" : "+"}
                        {formatCurrency(transaction.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <BudgetCategoryCard
                key={category.id}
                category={category}
                onEdit={handleEditCategory}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Latest budget transactions and expenses</CardDescription>
            </CardHeader>
            <CardContent>
              <BudgetTransactionTable
                transactions={transactions}
                onDelete={handleDeleteTransaction}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {analytics && <BudgetAnalyticsComponent analytics={analytics} />}
        </TabsContent>
      </Tabs>

      <BudgetForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        editingCategory={editingCategory}
        periods={periods.map((p) => ({ id: p.id, name: p.name }))}
      />
    </div>
  );
}
