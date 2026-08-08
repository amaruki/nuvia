import type { DonationPayment } from "@/types/finance";
import { formatCurrency } from "./helpers";

interface PaymentHistorySectionProps {
  donationId: string;
  payments: DonationPayment[];
}

export default function PaymentHistorySection({
  donationId,
  payments,
}: PaymentHistorySectionProps) {
  const donationPayments = payments.filter((payment) => payment.donationId === donationId);

  if (donationPayments.length === 0) return null;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Payment History</h3>
      <div className="space-y-3">
        {donationPayments.map((payment) => (
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
