"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  Calendar,
  Mail,
  CreditCard,
  User,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  FileText,
  Send,
  Download,
} from "lucide-react";
import { Invoice, InvoicePayment } from "@/types/finance.types";

interface InvoiceDetailsModalProps {
  invoice: Invoice | null;
  payments: InvoicePayment[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRecordPayment: (invoiceId: string, amount: number, paymentMethod: string) => void;
  onSendReminder: (invoiceId: string, type: "email" | "sms" | "in_app") => void;
}

export function InvoiceDetailsModal({
  invoice,
  payments,
  open,
  onOpenChange,
  onRecordPayment,
  onSendReminder,
}: InvoiceDetailsModalProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: Invoice["status"]) => {
    switch (status) {
      case "paid":
        return {
          variant: "default" as const,
          icon: CheckCircle,
          text: "Paid",
          color: "text-green-600",
        };
      case "sent":
        return { variant: "secondary" as const, icon: Send, text: "Sent", color: "text-blue-600" };
      case "overdue":
        return {
          variant: "destructive" as const,
          icon: AlertCircle,
          text: "Overdue",
          color: "text-red-600",
        };
      case "draft":
        return {
          variant: "outline" as const,
          icon: FileText,
          text: "Draft",
          color: "text-gray-600",
        };
      case "cancelled":
        return {
          variant: "outline" as const,
          icon: XCircle,
          text: "Cancelled",
          color: "text-gray-600",
        };
      case "refunded":
        return {
          variant: "outline" as const,
          icon: CreditCard,
          text: "Refunded",
          color: "text-orange-600",
        };
      default:
        return { variant: "secondary" as const, icon: Clock, text: status, color: "text-gray-600" };
    }
  };

  if (!invoice) return null;

  const statusBadge = getStatusBadge(invoice.status);
  const StatusIcon = statusBadge.icon;
  const balanceAmount = invoice.totalAmount - (invoice.paidAmount || 0);
  const isOverdue = invoice.status === "sent" && new Date(invoice.dueDate) < new Date();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 shrink-0" />
            Invoice Details
          </DialogTitle>
          <DialogDescription>View detailed information about this invoice</DialogDescription>
        </DialogHeader>

        <Separator />

        <div className="space-y-6">
          {/* Client Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Client Information</h3>
            {/* Responsive Grid: Stacks on mobile, 2 cols on tablet/desktop */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1 sm:space-y-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm font-medium">Client Name</span>
                </div>
                <p className="text-sm break-words">{invoice.clientName}</p>
              </div>
              <div className="space-y-1 sm:space-y-2">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm font-medium">Email</span>
                </div>
                <p className="text-sm break-all">{invoice.clientEmail}</p>
              </div>
              <div className="space-y-1 sm:space-y-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm font-medium">Invoice Number</span>
                </div>
                <p className="text-sm font-mono break-all">{invoice.invoiceNumber}</p>
              </div>
              <div className="space-y-1 sm:space-y-2">
                <div className="flex items-center gap-2">
                  <StatusIcon className={`h-4 w-4 shrink-0 ${statusBadge.color}`} />
                  <span className="text-sm font-medium">Status</span>
                </div>
                <Badge variant={statusBadge.variant} className="flex items-center gap-1 w-fit">
                  <StatusIcon className="h-3 w-3 shrink-0" />
                  {statusBadge.text}
                </Badge>
              </div>
            </div>

            {invoice.clientAddress && (
              <div className="space-y-1 sm:space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm font-medium">Address</span>
                </div>
                <p className="text-sm break-words">{invoice.clientAddress}</p>
              </div>
            )}
          </div>

          <Separator />

          {/* Invoice Information */}
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

          <Separator />

          {/* Invoice Items - Fully Responsive Grid Implementation */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Invoice Items</h3>
            <div className="border rounded-lg overflow-hidden">
              {/* Desktop Header: Hidden on mobile */}
              <div className="hidden sm:grid sm:grid-cols-[2fr_1fr_1fr_1fr] gap-4 p-4 font-medium text-sm border-b bg-muted/40">
                <div>Description</div>
                <div className="text-right">Quantity</div>
                <div className="text-right">Unit Price</div>
                <div className="text-right">Total</div>
              </div>

              {invoice.items.map((item, index) => (
                <div
                  key={item.id}
                  className={`
                    p-4 
                    flex flex-col gap-2
                    sm:grid sm:grid-cols-[2fr_1fr_1fr_1fr] sm:gap-4 
                    ${index < invoice.items.length - 1 ? "border-b sm:border-b-0" : ""} 
                    ${index % 2 === 0 ? "bg-muted/10" : ""}
                  `}
                >
                  {/* Description */}
                  <div className="font-medium sm:font-normal break-words">{item.description}</div>

                  {/* Stats Row for Mobile / Columns for Desktop */}
                  <div className="flex justify-between items-center sm:contents text-sm">
                    {/* Quantity */}
                    <div className="flex flex-col sm:block sm:text-right">
                      <span className="text-muted-foreground text-xs sm:hidden">Qty</span>
                      <span>{item.quantity}</span>
                    </div>

                    {/* Unit Price */}
                    <div className="flex flex-col sm:block sm:text-right">
                      <span className="text-muted-foreground text-xs sm:hidden">Price</span>
                      <span>{formatCurrency(item.unitPrice)}</span>
                    </div>

                    {/* Total */}
                    <div className="flex flex-col sm:block sm:text-right font-medium">
                      <span className="text-muted-foreground text-xs sm:hidden">Total</span>
                      <span>{formatCurrency(item.total)}</span>
                    </div>
                  </div>
                </div>
              ))}

              {/* Summary Section */}
              <div className="border-t bg-muted/5">
                <div className="flex justify-between p-4 sm:grid sm:grid-cols-[2fr_1fr_1fr_1fr] sm:gap-4">
                  <div className="sm:col-span-3 text-left sm:text-right font-medium">Subtotal</div>
                  <div className="text-right">{formatCurrency(invoice.subtotal)}</div>
                </div>
                <div className="flex justify-between px-4 pb-4 sm:grid sm:grid-cols-[2fr_1fr_1fr_1fr] sm:gap-4 sm:p-4 sm:pt-0">
                  <div className="sm:col-span-3 text-left sm:text-right font-medium">Tax</div>
                  <div className="text-right">{formatCurrency(invoice.taxAmount)}</div>
                </div>
                <div className="flex justify-between p-4 bg-muted/20 sm:grid sm:grid-cols-[2fr_1fr_1fr_1fr] sm:gap-4 font-bold text-lg">
                  <div className="sm:col-span-3 text-left sm:text-right">Total</div>
                  <div className="text-right">{formatCurrency(invoice.totalAmount)}</div>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Payment History */}
          {payments.filter((payment) => payment.invoiceId === invoice.id).length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Payment History</h3>
              <div className="space-y-3">
                {payments
                  .filter((payment) => payment.invoiceId === invoice.id)
                  .map((payment) => (
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
          )}

          {/* Actions: Stack vertically on mobile, row on desktop */}
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
