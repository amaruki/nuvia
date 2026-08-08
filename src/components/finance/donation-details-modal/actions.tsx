import { CheckCircle, CreditCard, Download, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Donation } from "@/types/finance";

interface DonationActionsProps {
  donation: Donation;
  onRecordPayment: (donationId: string, amount: number, paymentMethod: string) => void;
  onSendReceipt: (donationId: string) => void;
  onUpdateStatus: (donationId: string, status: Donation["status"]) => void;
  onOpenChange: (open: boolean) => void;
}

export default function DonationActions({
  donation,
  onRecordPayment,
  onSendReceipt,
  onUpdateStatus,
  onOpenChange,
}: DonationActionsProps) {
  return (
    <div className="flex flex-col flex-wrap sm:flex-row gap-3 pt-2 sm:pt-4">
      {donation.status !== "completed" && donation.status !== "refunded" && (
        <>
          <Button
            className="w-full sm:w-auto"
            onClick={() => onRecordPayment(donation.id, donation.amount, "Credit Card")}
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Record Payment
          </Button>
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => onUpdateStatus(donation.id, "completed")}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Mark as Completed
          </Button>
        </>
      )}
      {!donation.receiptSent && (
        <Button
          variant="outline"
          className="w-full sm:w-auto"
          onClick={() => onSendReceipt(donation.id)}
        >
          <Mail className="h-4 w-4 mr-2" />
          Send Receipt
        </Button>
      )}
      <Button variant="outline" className="w-full sm:w-auto">
        <Download className="h-4 w-4 mr-2" />
        Download Receipt
      </Button>
      <Button
        variant="outline"
        className="w-full sm:w-auto sm:ml-auto"
        onClick={() => onOpenChange(false)}
      >
        Close
      </Button>
    </div>
  );
}
