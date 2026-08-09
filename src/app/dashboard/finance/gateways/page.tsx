"use client";

import { useEffect } from "react";
import { RefreshCw, AlertTriangle, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useFinanceGateways } from "@/lib/hooks/use-finance-gateways";
import { useHeader } from "@/contexts/dashboard-context";

/**
 * C4: payment gateway dashboard.
 *
 * Shows the deployment's single configured gateway (PAYMENT_GATEWAY env,
 * docs/adr/0015) via GET /api/v1/finance/gateways. Gateways are deployment
 * configuration — there is no gateway CRUD, enable/disable, test connection
 * or transaction history to show, and this page does not invent any.
 * Credential *presence* is shown, never values.
 */
export default function FinanceGateways() {
  const { setHeader, clearHeader } = useHeader();
  const { gateway, loading, error, refreshData } = useFinanceGateways();

  useEffect(() => {
    setHeader({
      title: "Payment Gateways",
      description: "The payment processor configured for membership billing",
    });

    return () => {
      clearHeader();
    };
  }, [setHeader, clearHeader]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader className="pb-2">
            <Skeleton className="h-4 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-3 w-64 max-w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !gateway) {
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
          <AlertDescription>{error ?? "No gateway information available"}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Configured gateway */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-primary/10">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base sm:text-lg">{gateway.displayName}</CardTitle>
                <CardDescription className="text-sm">{gateway.provider} provider</CardDescription>
              </div>
            </div>
            <Badge variant="default">active</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{gateway.description}</p>
        </CardContent>
      </Card>

      {/* Configuration detail */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Configuration</CardTitle>
          <CardDescription className="text-sm">
            Read-only view of the deployment configuration — credential presence only, never values
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Setting</TableHead>
                <TableHead>Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Provider</TableCell>
                <TableCell>{gateway.provider}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Webhook endpoint</TableCell>
                <TableCell>{gateway.webhookEndpoint ?? "Not applicable"}</TableCell>
              </TableRow>
              {gateway.provider === "stripe" && (
                <>
                  <TableRow>
                    <TableCell className="font-medium">Secret key configured</TableCell>
                    <TableCell>{gateway.secretKeyConfigured ? "Yes" : "No"}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Webhook secret configured</TableCell>
                    <TableCell>{gateway.webhookSecretConfigured ? "Yes" : "No"}</TableCell>
                  </TableRow>
                </>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Alert>
        <AlertDescription>
          The payment gateway is deployment configuration (the PAYMENT_GATEWAY environment
          variable), not dashboard data — adding, editing, disabling or testing gateways happens in
          the deployment, not here.
        </AlertDescription>
      </Alert>
    </div>
  );
}
