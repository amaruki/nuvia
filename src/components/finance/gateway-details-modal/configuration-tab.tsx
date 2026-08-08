import { Shield, Zap, Activity, Webhook, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";
import type { PaymentGateway } from "@/types/finance";
import { formatCurrency } from "./helpers";

interface ConfigurationTabProps {
  gateway: PaymentGateway;
}

export default function ConfigurationTab({ gateway }: ConfigurationTabProps) {
  return (
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
                <Badge
                  variant={gateway.configuration.allowPartialPayments ? "default" : "secondary"}
                >
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
                <Badge
                  variant={gateway.configuration.subscriptionSupport ? "default" : "secondary"}
                >
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
              <p className="text-lg font-bold">{gateway.configuration.timeoutDuration}s</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Webhook Retries</p>
              <p className="text-lg font-bold">{gateway.configuration.webhookRetries}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Settlement Delay</p>
              <p className="text-lg font-bold">{gateway.configuration.settlementDelay}h</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
}
