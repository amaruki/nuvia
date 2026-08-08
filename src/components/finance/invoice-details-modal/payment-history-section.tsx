import type { InvoicePayment } from "@/types/finance";
import { formatCurrency } from "./helpers";

interface PaymentHistorySectionProps {
  invoiceId: string;
  payments: InvoicePayment[];
}

export function PaymentHistorySection({ invoiceId, payments }: PaymentHistorySectionProps) {
  const invoicePayments = payments.filter((payment) => payment.invoiceId === invoiceId);

  if (invoicePayments.length === 0) return null;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Payment History</h3>
      <div className="space-y-3">
        {invoicePayments.map((payment) => (
          <div key={payment.id} className="border rounded-lg p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <p className="font-medium">{payment.paymentMethod}</p>
                <p className="text-xs sm:text-sm text-muted-foreground break-all">
                  {payment.transactionId}
                </p>
              </div>
              <div className="text-left sm:text-right">
                <p className="font-medium">{formatCurrency(payment.amount)}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {new Date(payment.paymentDate).toLocaleDateString()}
                </p>
              </div>
            </div>
            {payment.notes && (
              <p className="text-xs sm:text-sm text-muted-foreground mt-2 break-words">
                {payment.notes}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
