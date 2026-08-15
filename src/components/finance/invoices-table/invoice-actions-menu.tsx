import { MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Invoice } from "@/types/finance";

interface InvoiceActionsMenuProps {
  invoice: Invoice;
  onViewDetails: (invoice: Invoice) => void;
  onRecordPayment: (invoice: Invoice) => void;
  onSendInvoice: (invoice: Invoice) => void;
  onSendReminder: (invoice: Invoice, type: "email" | "sms" | "in_app") => void;
}

export function InvoiceActionsMenu({
  invoice,
  onViewDetails,
  onRecordPayment,
  onSendInvoice,
  onSendReminder,
}: InvoiceActionsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Actions for invoice ${invoice.invoiceNumber}`}
          onClick={(event) => event.stopPropagation()}
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => onViewDetails(invoice)}>View Details</DropdownMenuItem>
        {invoice.status !== "paid" && invoice.status !== "cancelled" && (
          <>
            <DropdownMenuItem onClick={() => onRecordPayment(invoice)}>
              Record Payment
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onSendInvoice(invoice)}>Send Invoice</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSendReminder(invoice, "email")}>
              Send Email Reminder
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSendReminder(invoice, "sms")}>
              Send SMS Reminder
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
