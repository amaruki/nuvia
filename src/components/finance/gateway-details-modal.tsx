"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PaymentGateway, GatewayTransaction, GatewayTestResult } from "@/types/finance.types";
import {
  CreditCard,
  DollarSign,
  TrendingUp,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Globe,
  Settings,
  TestTube,
  ExternalLink,
  Calendar,
  Zap,
  Shield,
  RefreshCw,
  Eye,
  EyeOff,
  Key,
  Webhook,
  Star,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface GatewayDetailsModalProps {
  gateway: PaymentGateway | null;
  transactions: GatewayTransaction[];
  testResults: GatewayTestResult[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTest: (gateway: PaymentGateway) => Promise<void>;
  onToggleStatus: (gateway: PaymentGateway, enabled: boolean) => Promise<void>;
  onSetDefault: (gateway: PaymentGateway) => Promise<void>;
}

export function GatewayDetailsModal({
  gateway,
  transactions,
  testResults,
  open,
  onOpenChange,
  onTest,
  onToggleStatus,
  onSetDefault,
}: GatewayDetailsModalProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [testing, setTesting] = useState(false);

  if (!gateway) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "inactive":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "testing":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "error":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: "default" as const,
      inactive: "secondary" as const,
      testing: "outline" as const,
      error: "destructive" as const,
    };
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || "secondary"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getEnvironmentBadge = (environment: string) => {
    return (
      <Badge variant={environment === "production" ? "default" : "outline"}>
        {environment === "production" ? "Production" : "Sandbox"}
      </Badge>
    );
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      await onTest(gateway);
    } finally {
      setTesting(false);
    }
  };

  const handleToggleStatus = async () => {
    await onToggleStatus(gateway, !gateway.isEnabled);
  };

  const handleSetDefault = async () => {
    await onSetDefault(gateway);
  };

  const recentTransactions = transactions
    .filter(t => t.gatewayId === gateway.id)
    .slice(0, 10);

  const recentTestResults = testResults
    .filter(t => t.gatewayId === gateway.id)
    .slice(0, 5);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 shrink-0" />
            {gateway.displayName}
            {gateway.isDefault && (
              <Badge variant="outline" className="ml-2">
                Default
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            Detailed information and configuration for this payment gateway
          </DialogDescription>
        </DialogHeader>
        
        <Separator />

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="configuration">Configuration</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="tests">Tests</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Basic Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Basic Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Provider</p>
                      <p className="capitalize">{gateway.provider}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Environment</p>
                      <div>{getEnvironmentBadge(gateway.environment)}</div>
                    </div>
                  </div>
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Status</p>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(gateway.status)}
                        {gateway.lastTestedAt && (
                          <span className="text-xs text-muted-foreground">
                            Tested {formatDistanceToNow(gateway.lastTestedAt, { addSuffix: true })}
                          </span>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Enabled</p>
                      <Badge variant={gateway.isEnabled ? "default" : "secondary"}>
                        {gateway.isEnabled ? "Enabled" : "Disabled"}
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Currencies</p>
                    <div className="flex flex-wrap gap-1">
                      {gateway.currencies.map(currency => (
                        <Badge key={currency} variant="outline" className="text-xs">
                          {currency}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {gateway.description && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Description</p>
                      <p className="text-sm">{gateway.description}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Performance Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Performance Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Transactions</p>
                      <p className="text-2xl font-bold">
                        {gateway.statistics.totalTransactions.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Volume</p>
                      <p className="text-2xl font-bold">
                        {formatCurrency(gateway.statistics.totalVolume)}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
                      <div className="flex items-center gap-2">
                        <p className={`text-2xl font-bold ${
                          gateway.statistics.successRate >= 95 ? "text-green-600" :
                          gateway.statistics.successRate >= 90 ? "text-yellow-600" : "text-red-600"
                        }`}>
                          {formatPercentage(gateway.statistics.successRate)}
                        </p>
                        {gateway.statistics.errorRates.length > 0 && (
                          <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Avg Transaction</p>
                      <p className="text-2xl font-bold">
                        {formatCurrency(gateway.statistics.averageTransactionValue)}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Fees</p>
                      <p className="text-xl font-bold">
                        {formatCurrency(gateway.statistics.totalFees)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Refunds</p>
                      <p className="text-xl font-bold">
                        {gateway.statistics.refundCount}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Chargebacks</p>
                      <p className="text-xl font-bold">
                        {gateway.statistics.chargebackCount}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Payment Methods */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Supported Payment Methods
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {gateway.supportedPaymentMethods.map((method) => (
                    <div key={method.id} className="flex items-center gap-3 p-3 border rounded-lg">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
                        <CreditCard className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{method.displayName}</p>
                        <p className="text-sm text-muted-foreground capitalize">
                          {method.type.replace('_', ' ')}
                        </p>
                        {method.supportedNetworks && (
                          <p className="text-xs text-muted-foreground">
                            Networks: {method.supportedNetworks.join(', ')}
                          </p>
                        )}
                      </div>
                      <Badge variant={method.isEnabled ? "default" : "secondary"}>
                        {method.isEnabled ? "Enabled" : "Disabled"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="configuration" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Security Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Security Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Require CVV</span>
                      <Badge variant={gateway.configuration.requireCvv ? "default" : "secondary"}>
                        {gateway.configuration.requireCvv ? "Required" : "Not Required"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Require 3DS</span>
                      <Badge variant={gateway.configuration.require3ds ? "default" : "secondary"}>
                        {gateway.configuration.require3ds ? "Required" : "Not Required"}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Fraud Detection</span>
                      <Badge variant={gateway.configuration.fraudDetection ? "default" : "secondary"}>
                        {gateway.configuration.fraudDetection ? "Enabled" : "Disabled"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Dispute Management</span>
                      <Badge variant={gateway.configuration.disputeManagement ? "default" : "secondary"}>
                        {gateway.configuration.disputeManagement ? "Enabled" : "Disabled"}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Transaction Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Transaction Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Auto Capture</span>
                      <Badge variant={gateway.configuration.autoCapture ? "default" : "secondary"}>
                        {gateway.configuration.autoCapture ? "Enabled" : "Disabled"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Partial Payments</span>
                      <Badge variant={gateway.configuration.allowPartialPayments ? "default" : "secondary"}>
                        {gateway.configuration.allowPartialPayments ? "Allowed" : "Not Allowed"}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Recurring Payments</span>
                      <Badge variant={gateway.configuration.recurringPayments ? "default" : "secondary"}>
                        {gateway.configuration.recurringPayments ? "Supported" : "Not Supported"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Subscription Support</span>
                      <Badge variant={gateway.configuration.subscriptionSupport ? "default" : "secondary"}>
                        {gateway.configuration.subscriptionSupport ? "Supported" : "Not Supported"}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Limits */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Transaction Limits
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Min Transaction</p>
                      <p className="text-lg font-bold">
                        {formatCurrency(gateway.configuration.minTransactionAmount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Max Transaction</p>
                      <p className="text-lg font-bold">
                        {formatCurrency(gateway.configuration.maxTransactionAmount)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Daily Limit</p>
                      <p className="text-lg font-bold">
                        {formatCurrency(gateway.configuration.dailyTransactionLimit)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Monthly Limit</p>
                      <p className="text-lg font-bold">
                        {formatCurrency(gateway.configuration.monthlyTransactionLimit)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Webhook & API */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Webhook className="h-4 w-4" />
                  API & Webhook Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Webhook URL</p>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-mono bg-muted p-2 rounded">
                        {gateway.webhookUrl || "Not configured"}
                      </p>
                      {gateway.webhookUrl && (
                        <Button variant="outline" size="sm">
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Test
                        </Button>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Timeout Duration</p>
                    <p className="text-lg font-bold">
                      {gateway.configuration.timeoutDuration}s
                    </p>
                  </div>
                </div>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Webhook Retries</p>
                    <p className="text-lg font-bold">
                      {gateway.configuration.webhookRetries}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Settlement Delay</p>
                    <p className="text-lg font-bold">
                      {gateway.configuration.settlementDelay}h
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transactions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Recent Transactions
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentTransactions.length > 0 ? (
                  <div className="space-y-3">
                    {recentTransactions.map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="min-w-0 flex-1 mr-2">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-primary"></div>
                            <div>
                              <p className="text-sm font-medium">{transaction.transactionId}</p>
                              <p className="text-xs text-muted-foreground">
                                {transaction.customerName} • {transaction.paymentMethod}
                              </p>
                            </div>
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
                ) : (
                  <div className="text-center py-8">
                    <Activity className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Recent Transactions</h3>
                    <p className="text-sm text-muted-foreground">
                      This gateway hasn't processed any transactions yet.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tests" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TestTube className="h-4 w-4" />
                  Recent Test Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentTestResults.length > 0 ? (
                  <div className="space-y-3">
                    {recentTestResults.map((test, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="min-w-0 flex-1 mr-2">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${
                              test.status === "success" ? "bg-green-500" :
                              test.status === "failed" ? "bg-red-500" : "bg-yellow-500"
                            }`}></div>
                            <div>
                              <p className="text-sm font-medium">{test.testType}</p>
                              <p className="text-xs text-muted-foreground">
                                {test.message}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(test.testedAt, { addSuffix: true })}
                          </p>
                          <Badge variant={
                            test.status === "success" ? "default" :
                            test.status === "failed" ? "destructive" : "secondary"
                          }>
                            {test.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <TestTube className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Test Results</h3>
                    <p className="text-sm text-muted-foreground">
                      No tests have been run for this gateway yet.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end space-x-2 pt-6 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
          <Button
            onClick={handleTest}
            disabled={testing}
          >
            <TestTube className="mr-2 h-4 w-4" />
            {testing ? "Testing..." : "Test Connection"}
          </Button>
          {!gateway.isDefault && (
            <Button
              variant="outline"
              onClick={handleSetDefault}
            >
              <Star className="mr-2 h-4 w-4" />
              Set as Default
            </Button>
          )}
          <Button
            variant={gateway.isEnabled ? "destructive" : "default"}
            onClick={handleToggleStatus}
          >
            {gateway.isEnabled ? (
              <>
                <EyeOff className="mr-2 h-4 w-4" />
                Disable
              </>
            ) : (
              <>
                <Eye className="mr-2 h-4 w-4" />
                Enable
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}