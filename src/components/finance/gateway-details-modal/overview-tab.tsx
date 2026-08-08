import { Settings, TrendingUp, AlertTriangle, CreditCard } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";
import { formatDistanceToNow } from "date-fns";
import type { PaymentGateway } from "@/types/finance";
import { formatCurrency, formatPercentage } from "./helpers";
import getStatusBadge from "./status-badge";
import getEnvironmentBadge from "./environment-badge";

interface OverviewTabProps {
  gateway: PaymentGateway;
}

export default function OverviewTab({ gateway }: OverviewTabProps) {
  return (
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
                {gateway.currencies.map((currency) => (
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
                  <p
                    className={`text-2xl font-bold ${
                      gateway.statistics.successRate >= 95
                        ? "text-green-600"
                        : gateway.statistics.successRate >= 90
                          ? "text-yellow-600"
                          : "text-red-600"
                    }`}
                  >
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
                <p className="text-xl font-bold">{formatCurrency(gateway.statistics.totalFees)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Refunds</p>
                <p className="text-xl font-bold">{gateway.statistics.refundCount}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Chargebacks</p>
                <p className="text-xl font-bold">{gateway.statistics.chargebackCount}</p>
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
                    {method.type.replace("_", " ")}
                  </p>
                  {method.supportedNetworks && (
                    <p className="text-xs text-muted-foreground">
                      Networks: {method.supportedNetworks.join(", ")}
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
  );
}
