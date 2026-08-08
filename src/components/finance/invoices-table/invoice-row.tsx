import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TableCell, TableRow } from "@/components/ui/table";
import { CreditCard, Download, Eye, Mail, MoreHorizontal, Send } from "lucide-react";
import type { Invoice } from "@/types/finance";
import { formatCurrency, getBalanceAmount, isOverdue } from "./helpers";
import InvoiceStatusBadge from "./status-badge";
import type { InvoiceItemActions } from "./types";

interface InvoiceRowProps extends InvoiceItemActions {
  invoice: Invoice;
}

export default function InvoiceRow({
  invoice,
  onViewDetails,
  onRecordPayment,
  onSendInvoice,
  onSendReminder,
}: InvoiceRowProps) {
  const balanceAmount = getBalanceAmount(invoice);
  const overdue = isOverdue(invoice.dueDate, invoice.status);

  return (
    <TableRow>
      <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
      <TableCell>
        <div>
          <div className="font-medium">{invoice.clientName}</div>
          <div className="text-sm text-muted-foreground">{invoice.clientEmail}</div>
        </div>
      </TableCell>
      <TableCell>{formatCurrency(invoice.totalAmount)}</TableCell>
      <TableCell>{formatCurrency(invoice.paidAmount || 0)}</TableCell>
      <TableCell className={balanceAmount > 0 ? "font-medium text-red-600" : ""}>
        {formatCurrency(balanceAmount)}
      </TableCell>
      <TableCell>
        <div className={overdue ? "text-red-600" : ""}>
          {new Date(invoice.dueDate).toLocaleDateString()}
          {overdue && <div className="text-xs">Overdue</div>}
        </div>
      </TableCell>
      <TableCell>
        <InvoiceStatusBadge invoice={invoice} className="flex items-center gap-1 w-fit" />
      </TableCell>
      <TableCell className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onViewDetails(invoice)}>
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>

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
      </TableCell>
    </TableRow>
  );
}
