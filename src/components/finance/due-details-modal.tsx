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
} from "lucide-react";
import { MemberDue, DuePayment } from "@/types/finance";

interface DueDetailsModalProps {
  due: MemberDue | null;
  payments: DuePayment[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRecordPayment: (dueId: string, amount: number, paymentMethod: string) => void;
  onSendReminder: (dueId: string, type: "email" | "sms" | "in_app") => void;
}

export function DueDetailsModal({
  due,
  payments,
  open,
  onOpenChange,
  onRecordPayment,
  onSendReminder,
}: DueDetailsModalProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: MemberDue["status"]) => {
    switch (status) {
      case "paid":
        return {
          variant: "default" as const,
          icon: CheckCircle,
          text: "Paid",
          color: "text-green-600",
        };
      case "pending":
        return {
          variant: "secondary" as const,
          icon: Clock,
          text: "Pending",
          color: "text-yellow-600",
        };
      case "overdue":
        return {
          variant: "destructive" as const,
          icon: AlertCircle,
          text: "Overdue",
          color: "text-red-600",
        };
      case "partial":
        return {
          variant: "outline" as const,
          icon: CreditCard,
          text: "Partial",
          color: "text-blue-600",
        };
      case "cancelled":
        return {
          variant: "outline" as const,
          icon: XCircle,
          text: "Cancelled",
          color: "text-gray-600",
        };
      default:
        return { variant: "secondary" as const, icon: Clock, text: status, color: "text-gray-600" };
    }
  };

  if (!due) return null;

  const statusBadge = getStatusBadge(due.status);
  const StatusIcon = statusBadge.icon;
  const duePayments = payments.filter((payment) => payment.dueId === due.id);
  const isOverdue = due.status === "pending" && new Date(due.dueDate) < new Date();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Member Due Details
          </DialogTitle>
          <DialogDescription>View detailed information about this membership due</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Member Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Member Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Name</span>
                </div>
                <p className="text-sm">{due.memberName}</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Email</span>
                </div>
                <p className="text-sm">{due.memberEmail}</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Membership Tier</span>
                </div>
                <Badge variant="outline">{due.membershipTier}</Badge>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <StatusIcon className={`h-4 w-4 ${statusBadge.color}`} />
                  <span className="text-sm font-medium">Status</span>
                </div>
                <Badge variant={statusBadge.variant} className="flex items-center gap-1 w-fit">
                  <StatusIcon className="h-3 w-3" />
                  {statusBadge.text}
                </Badge>
              </div>
            </div>
          </div>

          <Separator />

          {/* Due Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Due Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Due Amount</span>
                </div>
                <p className="text-lg font-semibold">{formatCurrency(due.dueAmount)}</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Due Date</span>
                </div>
                <p className={`text-sm ${isOverdue ? "text-red-600 font-medium" : ""}`}>
                  {new Date(due.dueDate).toLocaleDateString()}
                  {isOverdue && <span className="block text-xs">Overdue</span>}
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Paid Amount</span>
                </div>
                <p className="text-lg font-semibold text-green-600">
                  {formatCurrency(due.paidAmount)}
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Balance</span>
                </div>
                <p
                  className={`text-lg font-semibold ${due.balanceAmount > 0 ? "text-red-600" : "text-green-600"}`}
                >
                  {formatCurrency(due.balanceAmount)}
                </p>
              </div>
            </div>

            {due.paymentMethod && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Payment Method</span>
                </div>
                <p className="text-sm">{due.paymentMethod}</p>
              </div>
            )}

            {due.transactionId && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Transaction ID</span>
                </div>
                <p className="text-sm font-mono">{due.transactionId}</p>
              </div>
            )}

            {due.notes && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Notes</span>
                </div>
                <p className="text-sm">{due.notes}</p>
              </div>
            )}
          </div>

          <Separator />

          {/* Payment History */}
          {duePayments.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Payment History</h3>
              <div className="space-y-3">
                {duePayments.map((payment) => (
                  <div key={payment.id} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{payment.paymentMethod}</p>
                        <p className="text-sm text-muted-foreground">{payment.transactionId}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(payment.amount)}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(payment.paymentDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    {payment.notes && (
                      <p className="text-sm text-muted-foreground mt-2">{payment.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            {due.status !== "paid" && due.status !== "cancelled" && (
              <>
                <Button onClick={() => onRecordPayment(due.id, due.balanceAmount, "Credit Card")}>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Record Payment
                </Button>
                <Button variant="outline" onClick={() => onSendReminder(due.id, "email")}>
                  <Mail className="h-4 w-4 mr-2" />
                  Send Reminder
                </Button>
              </>
            )}
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
