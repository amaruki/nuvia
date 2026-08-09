import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { DuePayment } from "@/types/finance";
import { formatCurrency } from "./helpers";

interface RecentPaymentsCardProps {
  payments: DuePayment[];
}

export function RecentPaymentsCard({ payments }: RecentPaymentsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Payments</CardTitle>
        <CardDescription>Latest payment transactions</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {payments.map((payment) => (
            <div key={payment.id} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{payment.paymentMethod}</p>
                <p className="text-xs text-muted-foreground">{payment.transactionId}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">{formatCurrency(payment.amount)}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(payment.paymentDate).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
