import { Button } from "@/components/ui/button";
import { CreditCard, Download, Mail } from "lucide-react";
import type { Invoice } from "@/types/finance";

interface ModalActionsProps {
  invoice: Invoice;
  balanceAmount: number;
  onRecordPayment: (invoiceId: string, amount: number, paymentMethod: string) => void;
  onSendReminder: (invoiceId: string, type: "email" | "sms" | "in_app") => void;
  onOpenChange: (open: boolean) => void;
}

export function ModalActions({
  invoice,
  balanceAmount,
  onRecordPayment,
  onSendReminder,
  onOpenChange,
}: ModalActionsProps) {
  return (
    /* Actions: Stack vertically on mobile, row on desktop */
    <div className="flex flex-col flex-wrap sm:flex-row gap-3 pt-2 sm:pt-4">
      {invoice.status !== "paid" &&
        invoice.status !== "cancelled" &&
        invoice.status !== "refunded" && (
          <>
            <Button
              className="w-full sm:w-auto"
              onClick={() => onRecordPayment(invoice.id, balanceAmount, "Credit Card")}
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Record Payment
            </Button>
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => onSendReminder(invoice.id, "email")}
            >
              <Mail className="h-4 w-4 mr-2" />
              Send Reminder
            </Button>
          </>
        )}
      <Button variant="outline" className="w-full sm:w-auto">
        <Download className="h-4 w-4 mr-2" />
        Download PDF
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
