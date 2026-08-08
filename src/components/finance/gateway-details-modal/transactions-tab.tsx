import { Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";
import type { GatewayTransaction, PaymentGateway } from "@/types/finance";
import { formatCurrency } from "./helpers";

interface TransactionsTabProps {
  gateway: PaymentGateway;
  transactions: GatewayTransaction[];
}

export default function TransactionsTab({ gateway, transactions }: TransactionsTabProps) {
  const recentTransactions = transactions.filter((t) => t.gatewayId === gateway.id).slice(0, 10);

  return (
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
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
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
                    <p className="text-sm font-bold">{formatCurrency(transaction.amount)}</p>
                    <Badge
                      variant={
                        transaction.status === "completed"
                          ? "default"
                          : transaction.status === "failed"
                            ? "destructive"
                            : "secondary"
                      }
                    >
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
  );
}
