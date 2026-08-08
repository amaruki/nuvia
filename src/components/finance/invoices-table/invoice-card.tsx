import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CreditCard, Download, Eye, Mail, MoreHorizontal, Send } from "lucide-react";
import type { Invoice } from "@/types/finance";
import { formatCurrency, getBalanceAmount, isOverdue } from "./helpers";
import InvoiceStatusBadge from "./status-badge";
import type { InvoiceItemActions } from "./types";

interface InvoiceCardProps extends InvoiceItemActions {
  invoice: Invoice;
}

export default function InvoiceCard({
  invoice,
  onViewDetails,
  onRecordPayment,
  onSendInvoice,
  onSendReminder,
}: InvoiceCardProps) {
  const balanceAmount = getBalanceAmount(invoice);
  const overdue = isOverdue(invoice.dueDate, invoice.status);

  return (
    <Card className="p-4">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{invoice.invoiceNumber}</p>
          <p className="text-sm text-muted-foreground truncate">{invoice.clientName}</p>
        </div>
        <InvoiceStatusBadge invoice={invoice} className="flex items-center gap-1 ml-2 shrink-0" />
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Amount:</span>
          <span className="font-medium">{formatCurrency(invoice.totalAmount)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Paid:</span>
          <span>{formatCurrency(invoice.paidAmount || 0)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Balance:</span>
          <span className={`font-medium ${balanceAmount > 0 ? "text-red-600" : ""}`}>
            {formatCurrency(balanceAmount)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Due:</span>
          <span className={overdue ? "text-red-600" : ""}>
            {new Date(invoice.dueDate).toLocaleDateString()}
            {overdue && <span className="block text-xs">Overdue</span>}
          </span>
        </div>
      </div>

      <div className="flex gap-2 mt-4">
        <Button
          size="sm"
          variant="outline"
          className="flex-1"
          onClick={() => onViewDetails(invoice)}
        >
          <Eye className="h-4 w-4 mr-1" />
          View
        </Button>

        {invoice.status === "draft" && (
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={() => onSendInvoice(invoice.id)}
          >
            <Send className="h-4 w-4 mr-1" />
            Send
          </Button>
        )}

        {invoice.status !== "paid" &&
          invoice.status !== "cancelled" &&
          invoice.status !== "refunded" && (
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={() => onRecordPayment(invoice)}
            >
              <CreditCard className="h-4 w-4 mr-1" />
              Pay
            </Button>
          )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="px-2">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {invoice.status !== "draft" && (
              <DropdownMenuItem onClick={() => onViewDetails(invoice)}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
            )}

            {invoice.status === "draft" && (
              <DropdownMenuItem onClick={() => onSendInvoice(invoice.id)}>
                <Send className="mr-2 h-4 w-4" />
                Send Invoice
              </DropdownMenuItem>
            )}

            {invoice.status !== "paid" &&
              invoice.status !== "cancelled" &&
              invoice.status !== "refunded" && (
                <>
                  <DropdownMenuItem onClick={() => onRecordPayment(invoice)}>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Record Payment
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem onClick={() => onSendReminder(invoice.id, "email")}>
                    <Mail className="mr-2 h-4 w-4" />
                    Send Reminder
                  </DropdownMenuItem>
                </>
              )}

            <DropdownMenuSeparator />

            <DropdownMenuItem>
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Card>
  );
}
