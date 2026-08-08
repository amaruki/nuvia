import { Calendar, CreditCard, DollarSign, FileText } from "lucide-react";
import type { Invoice } from "@/types/finance";
import { formatCurrency } from "./helpers";

interface InvoiceInfoSectionProps {
  invoice: Invoice;
  balanceAmount: number;
  isOverdue: boolean;
}

export function InvoiceInfoSection({ invoice, balanceAmount, isOverdue }: InvoiceInfoSectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Invoice Information</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1 sm:space-y-2">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-sm font-medium">Total Amount</span>
          </div>
          <p className="text-lg font-semibold">{formatCurrency(invoice.totalAmount)}</p>
        </div>
        <div className="space-y-1 sm:space-y-2">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-sm font-medium">Issue Date</span>
          </div>
          <p className="text-sm">{new Date(invoice.issueDate).toLocaleDateString()}</p>
        </div>
        <div className="space-y-1 sm:space-y-2">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-sm font-medium">Due Date</span>
          </div>
          <p className={`text-sm ${isOverdue ? "text-red-600 font-medium" : ""}`}>
            {new Date(invoice.dueDate).toLocaleDateString()}
            {isOverdue && <span className="block text-xs">Overdue</span>}
          </p>
        </div>
        <div className="space-y-1 sm:space-y-2">
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-sm font-medium">Paid Amount</span>
          </div>
          <p className="text-lg font-semibold text-green-600">
            {formatCurrency(invoice.paidAmount || 0)}
          </p>
        </div>
        <div className="space-y-1 sm:space-y-2">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-sm font-medium">Balance</span>
          </div>
          <p
            className={`text-lg font-semibold ${balanceAmount > 0 ? "text-red-600" : "text-green-600"}`}
          >
            {formatCurrency(balanceAmount)}
          </p>
        </div>
      </div>

      {invoice.paymentMethod && (
        <div className="space-y-1 sm:space-y-2">
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-sm font-medium">Payment Method</span>
          </div>
          <p className="text-sm break-words">{invoice.paymentMethod}</p>
        </div>
      )}

      {invoice.transactionId && (
        <div className="space-y-1 sm:space-y-2">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-sm font-medium">Transaction ID</span>
          </div>
          <p className="text-sm font-mono break-all">{invoice.transactionId}</p>
        </div>
      )}

      {invoice.notes && (
        <div className="space-y-1 sm:space-y-2">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-sm font-medium">Notes</span>
          </div>
          <p className="text-sm break-words">{invoice.notes}</p>
        </div>
      )}
    </div>
  );
}
