"use client";

import { useEffect } from "react";
import { Plus, Receipt, RefreshCw } from "lucide-react";

import { BudgetOverviewCards } from "@/components/finance/budget-overview-cards";
import { BudgetTransactionTable } from "@/components/finance/budget-transaction-table";
import { PageErrorState, PageLoadingState } from "@/components/dashboard/page-states";
import { useFormSheet } from "@/components/dashboard/form-sheet";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useHeader } from "@/contexts/dashboard-context";
import { useDataTableState } from "@/hooks/use-data-table-state";
import { useFinanceBudgets } from "@/lib/hooks/use-finance-budgets";

import { BudgetCategorySheet } from "./_components/budget-category-sheet";
import { BudgetTransactionSheet } from "./_components/budget-transaction-sheet";

/**
 * Budget dashboard: categories + transactions from the budget store
 * (budget_categories / budget_transactions). Overview cards are derived
 * client-side from the categories list (exact server-computed spend) plus a
 * bounded transaction window; the table is server-paginated. Create a
 * category with ?form=new, record a transaction with ?transaction=new, and
 * review one with ?transaction=<id>.
 */
export default function FinanceBudget() {
  const { setHeader, clearHeader } = useHeader();

  // URL-synced table state (sort/search/page) shared with the table.
  const tableState = useDataTableState({ defaultPageSize: 20 });

  const {
    transactions,
    total,
    totalPages,
    loading,
    fetching,
    error,
    categories,
    overview,
    createCategory,
    recordTransaction,
    updateTransaction,
    refreshData,
  } = useFinanceBudgets({
    page: tableState.state.page,
    pageSize: tableState.state.pageSize,
  });

  const categorySheet = useFormSheet("form");
  const transactionSheet = useFormSheet("transaction");

  useEffect(() => {
    setHeader({
      title: "Budget Management",
      description: "Budget planning, categories, and spend tracking",
    });

    return () => {
      clearHeader();
    };
  }, [setHeader, clearHeader]);

  // Clamp a stale ?page= param after the list shrinks.
  useEffect(() => {
    if (totalPages > 0 && tableState.state.page > totalPages) {
      tableState.setPage(totalPages);
    }
  }, [totalPages, tableState.state.page, tableState]);

  if (loading) {
    return <PageLoadingState />;
  }

  if (error) {
    return <PageErrorState error={error} onRetry={refreshData} />;
  }

  return (
    <div className="space-y-6">
      <BudgetOverviewCards overview={overview} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Transactions</h2>
          <p className="text-sm text-muted-foreground">
            {total} {total === 1 ? "transaction" : "transactions"} recorded
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={refreshData}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button variant="secondary" onClick={categorySheet.openCreate}>
            <Plus className="h-4 w-4" />
            New Category
          </Button>
          <Button onClick={transactionSheet.openCreate}>
            <Receipt className="h-4 w-4" />
            Record Transaction
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Recent activity</CardTitle>
        </CardHeader>
        <CardContent>
          <BudgetTransactionTable
            transactions={transactions}
            total={total}
            totalPages={totalPages}
            loading={fetching}
            onEdit={(transaction) => transactionSheet.openEdit(transaction.id)}
            onRefresh={refreshData}
            tableState={tableState}
          />
        </CardContent>
      </Card>

      <BudgetCategorySheet sheet={categorySheet} onCreate={createCategory} />
      <BudgetTransactionSheet
        sheet={transactionSheet}
        categories={categories}
        onRecord={recordTransaction}
        onUpdate={updateTransaction}
      />
    </div>
  );
}
