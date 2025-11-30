"use client";

import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { 
  RefreshCw,
  AlertTriangle,
  Download,
  Plus,
  CreditCard,
  Settings,
  TestTube,
  Filter,
} from "lucide-react";

import { GatewaysOverviewCards } from "@/components/finance/gateways-overview-cards";
import { GatewaysTable } from "@/components/finance/gateways-table";
import { GatewaysFilters } from "@/components/finance/gateways-filters";
import { AddGatewayForm } from "@/components/finance/add-gateway-form";
import { GatewayDetailsModal } from "@/components/finance/gateway-details-modal";
import { useGateways } from "@/lib/hooks/use-gateways";
import { useHeader } from "@/contexts/dashboard-context";
import { PaymentGateway, GatewayTransaction } from "@/types/finance.types";

export default function FinanceGateways() {
  const [activeTab, setActiveTab] = useState("overview");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedGateway, setSelectedGateway] = useState<PaymentGateway | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingGateway, setEditingGateway] = useState<PaymentGateway | null>(null);
  const { setHeader, clearHeader } = useHeader();

  const {
    gateways,
    transactions,
    testResults,
    statistics,
    loading,
    error,
    filters,
    updateFilters,
    clearFilters,
    refreshData,
    addGateway,
    updateGateway,
    deleteGateway,
    toggleGatewayStatus,
    testGateway,
    setDefaultGateway,
  } = useGateways();

  useEffect(() => {
    setHeader({
      title: "Payment Gateways",
      description: "Manage payment processing infrastructure and gateway configurations",
    });

    return () => {
      clearHeader();
    };
  }, [setHeader, clearHeader]);

  const handleViewDetails = (gateway: PaymentGateway) => {
    setSelectedGateway(gateway);
  };

  const handleEdit = (gateway: PaymentGateway) => {
    setEditingGateway(gateway);
    setShowAddForm(true);
  };

  const handleAdd = () => {
    setEditingGateway(null);
    setShowAddForm(true);
  };

  const handleFormSubmit = async (data: any) => {
    try {
      if (editingGateway) {
        await updateGateway(editingGateway.id, data);
      } else {
        await addGateway(data);
      }
      setShowAddForm(false);
      setEditingGateway(null);
    } catch (error) {
      console.error("Error saving gateway:", error);
    }
  };

  const handleDelete = async (gateway: PaymentGateway) => {
    if (confirm(`Are you sure you want to delete "${gateway.displayName}"? This action cannot be undone.`)) {
      try {
        await deleteGateway(gateway.id);
      } catch (error) {
        console.error("Error deleting gateway:", error);
      }
    }
  };

  const handleToggleStatus = async (gateway: PaymentGateway, enabled: boolean) => {
    try {
      await toggleGatewayStatus(gateway.id, enabled);
    } catch (error) {
      console.error("Error toggling gateway status:", error);
    }
  };

  const handleTest = async (gateway: PaymentGateway) => {
    try {
      await testGateway(gateway.id);
    } catch (error) {
      console.error("Error testing gateway:", error);
    }
  };

  const handleSetDefault = async (gateway: PaymentGateway) => {
    try {
      await setDefaultGateway(gateway.id);
    } catch (error) {
      console.error("Error setting default gateway:", error);
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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-muted rounded w-20 mb-2"></div>
              <div className="h-8 bg-muted rounded w-32 mb-2"></div>
              <div className="h-3 bg-muted rounded w-24"></div>
            </div>
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
      {/* Statistics Overview */}
      {statistics && <GatewaysOverviewCards statistics={statistics} />}

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
          <Badge variant="outline" className="text-sm">
            {gateways.length} gateways total
          </Badge>
          {statistics && (
            <Badge variant="secondary" className="text-sm">
              {statistics.activeGateways} active
            </Badge>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="flex-1 sm:flex-none"
          >
            <Filter className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Filters</span>
          </Button>
          <Button variant="outline" size="sm" onClick={refreshData} className="flex-1 sm:flex-none">
            <RefreshCw className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          <Button size="sm" className="flex-1 sm:flex-none" onClick={handleAdd}>
            <Plus className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Add Gateway</span>
            <span className="sm:hidden">Add</span>
          </Button>
          <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
            <Download className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
          </Button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <GatewaysFilters
          filters={filters}
          onFiltersChange={updateFilters}
          onClearFilters={clearFilters}
        />
      )}

      {/* Main Content Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto">
          <TabsTrigger value="overview" className="text-xs sm:text-sm py-2 px-2">Overview</TabsTrigger>
          <TabsTrigger value="gateways" className="text-xs sm:text-sm py-2 px-2">Gateways</TabsTrigger>
          <TabsTrigger value="transactions" className="text-xs sm:text-sm py-2 px-2">Transactions</TabsTrigger>
          <TabsTrigger value="analytics" className="text-xs sm:text-sm py-2 px-2">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Gateway Status Summary */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Gateway Status Summary</h3>
              <div className="space-y-3">
                {gateways.map((gateway) => (
                  <div key={gateway.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
                        <CreditCard className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{gateway.displayName}</p>
                        <p className="text-sm text-muted-foreground">
                          {gateway.provider} • {gateway.environment}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={
                        gateway.status === "active" ? "default" :
                        gateway.status === "error" ? "destructive" : "secondary"
                      }>
                        {gateway.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Recent Activity</h3>
              <div className="space-y-3">
                {transactions.slice(0, 5).map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="min-w-0 flex-1 mr-2">
                      <div>
                        <p className="text-sm font-medium">{transaction.transactionId}</p>
                        <p className="text-xs text-muted-foreground">
                          {transaction.gatewayName} • {transaction.paymentMethod}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold">
                        {formatCurrency(transaction.amount)}
                      </p>
                      <Badge variant={
                        transaction.status === "completed" ? "default" :
                        transaction.status === "failed" ? "destructive" : "secondary"
                      }>
                        {transaction.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          {statistics && (
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Success Rates</h3>
                <div className="space-y-3">
                  {gateways
                    .sort((a, b) => b.statistics.successRate - a.statistics.successRate)
                    .slice(0, 3)
                    .map((gateway) => (
                      <div key={gateway.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="min-w-0 flex-1 mr-2">
                          <p className="font-medium">{gateway.displayName}</p>
                          <p className="text-sm text-muted-foreground">
                            {gateway.statistics.totalTransactions} transactions
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className={`text-lg font-bold ${
                            gateway.statistics.successRate >= 95 ? "text-green-600" :
                            gateway.statistics.successRate >= 90 ? "text-yellow-600" : "text-red-600"
                          }`}>
                            {gateway.statistics.successRate.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Volume Distribution</h3>
                <div className="space-y-3">
                  {gateways
                    .sort((a, b) => b.statistics.totalVolume - a.statistics.totalVolume)
                    .slice(0, 3)
                    .map((gateway) => (
                      <div key={gateway.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="min-w-0 flex-1 mr-2">
                          <p className="font-medium">{gateway.displayName}</p>
                          <p className="text-sm text-muted-foreground">
                            {gateway.statistics.totalTransactions} transactions
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-lg font-bold">
                            {formatCurrency(gateway.statistics.totalVolume)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {((gateway.statistics.totalVolume / statistics.totalVolume) * 100).toFixed(1)}% of total
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="gateways" className="space-y-6">
          <GatewaysTable
            gateways={gateways}
            onViewDetails={handleViewDetails}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onToggleStatus={handleToggleStatus}
            onTest={handleTest}
            onSetDefault={handleSetDefault}
          />
        </TabsContent>

        <TabsContent value="transactions" className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Recent Transactions</h3>
            <div className="space-y-3">
              {transactions.slice(0, 10).map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="min-w-0 flex-1 mr-2">
                    <div>
                      <p className="text-sm font-medium">{transaction.transactionId}</p>
                      <p className="text-xs text-muted-foreground">
                        {transaction.gatewayName} • {transaction.customerName} • {transaction.paymentMethod}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold">
                      {formatCurrency(transaction.amount)}
                    </p>
                    <Badge variant={
                      transaction.status === "completed" ? "default" :
                      transaction.status === "failed" ? "destructive" : "secondary"
                    }>
                      {transaction.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Gateway Performance */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Gateway Performance</h3>
              <div className="space-y-3">
                {statistics?.gatewayBreakdown
                  ?.sort((a, b) => b.successRate - a.successRate)
                  ?.slice(0, 5)
                  ?.map((gateway) => (
                    <div key={gateway.gatewayId} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="min-w-0 flex-1 mr-2">
                        <p className="font-medium">{gateway.gatewayName}</p>
                        <p className="text-sm text-muted-foreground">
                          {gateway.transactionCount} transactions • {formatCurrency(gateway.volume)}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-lg font-bold">
                          {gateway.successRate.toFixed(1)}%
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatCurrency(gateway.fees)} fees
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Payment Method Usage */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Payment Method Usage</h3>
              <div className="space-y-3">
                {statistics?.paymentMethodUsage
                  ?.sort((a, b) => b.count - a.count)
                  ?.slice(0, 5)
                  ?.map((method) => (
                    <div key={method.method} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="min-w-0 flex-1 mr-2">
                        <p className="font-medium capitalize">
                          {method.method.replace('_', ' ')}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {method.count} transactions
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-lg font-bold">
                          {method.percentage.toFixed(1)}%
                        </p>
                        <p className="text-xs text-muted-foreground">
                          of total usage
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Monthly Trends */}
          {statistics?.monthlyTrend && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Monthly Trends</h3>
              <div className="space-y-3">
                {statistics.monthlyTrend.slice(0, 6).map((month, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="min-w-0 flex-1 mr-2">
                      <p className="font-medium">{month.month}</p>
                      <p className="text-sm text-muted-foreground">
                        {month.transactionCount} transactions
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-lg font-bold">
                        {formatCurrency(month.volume)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {month.successRate.toFixed(1)}% success rate
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <GatewayDetailsModal
        gateway={selectedGateway}
        transactions={transactions}
        testResults={testResults}
        open={!!selectedGateway}
        onOpenChange={(open) => !open && setSelectedGateway(null)}
        onTest={handleTest}
        onToggleStatus={handleToggleStatus}
        onSetDefault={handleSetDefault}
      />

      <AddGatewayForm
        open={showAddForm}
        onOpenChange={setShowAddForm}
        onSubmit={handleFormSubmit}
        initialData={editingGateway || undefined}
        isEditing={!!editingGateway}
      />
    </div>
  );
}