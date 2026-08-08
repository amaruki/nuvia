import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { InvoicePayment } from "@/types/finance";
import { formatCurrency } from "./helpers";

interface PaymentsTabProps {
  payments: InvoicePayment[];
}

export function PaymentsTab({ payments }: PaymentsTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base sm:text-lg">Recent Payments</CardTitle>
        <CardDescription className="text-sm">Latest payment transactions</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {payments.map((payment) => (
            <div key={payment.id} className="flex items-center justify-between">
              <div className="min-w-0 flex-1 mr-2">
                <p className="text-sm font-medium truncate">{payment.paymentMethod}</p>
                <p className="text-xs text-muted-foreground truncate">{payment.transactionId}</p>
              </div>
              <div className="text-right shrink-0">
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
