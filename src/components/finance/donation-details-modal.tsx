"use client";

import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Gift,
  HandHeart,
  Repeat,
  Target,
  Building,
  UserX,
  Edit,
  Trash2,
  Printer,
  Share2,
} from "lucide-react";
import { Donation, DonationPayment } from "@/types/finance";

interface DonationDetailsModalProps {
  donation: Donation | null;
  payments: DonationPayment[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRecordPayment: (donationId: string, amount: number, paymentMethod: string) => void;
  onSendReceipt: (donationId: string) => void;
  onUpdateStatus: (donationId: string, status: Donation["status"]) => void;
}

export function DonationDetailsModal({
  donation,
  payments,
  open,
  onOpenChange,
  onRecordPayment,
  onSendReceipt,
  onUpdateStatus,
}: DonationDetailsModalProps) {
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Credit Card");
  const [isRecordingPayment, setIsRecordingPayment] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleRecordPayment = async () => {
    if (!paymentAmount || parseFloat(paymentAmount) <= 0 || !donation) return;

    setIsRecordingPayment(true);
    const success = await onRecordPayment(donation.id, parseFloat(paymentAmount), paymentMethod);
    if (success !== undefined && success) {
      setPaymentAmount("");
      setPaymentMethod("Credit Card");
    }
    setIsRecordingPayment(false);
  };

  const getStatusBadge = (status: Donation["status"]) => {
    switch (status) {
      case "completed":
        return {
          variant: "default" as const,
          icon: CheckCircle,
          text: "Completed",
          color: "text-green-600",
        };
      case "pending":
        return {
          variant: "secondary" as const,
          icon: Clock,
          text: "Pending",
          color: "text-yellow-600",
        };
      case "failed":
        return {
          variant: "destructive" as const,
          icon: XCircle,
          text: "Failed",
          color: "text-red-600",
        };
      case "refunded":
        return {
          variant: "outline" as const,
          icon: AlertCircle,
          text: "Refunded",
          color: "text-orange-600",
        };
      case "pledged":
        return {
          variant: "secondary" as const,
          icon: HandHeart,
          text: "Pledged",
          color: "text-blue-600",
        };
      default:
        return { variant: "secondary" as const, icon: Clock, text: status, color: "text-gray-600" };
    }
  };

  const getDonorTypeIcon = (donorType: Donation["donorType"]) => {
    switch (donorType) {
      case "individual":
        return User;
      case "organization":
        return Building;
      case "anonymous":
        return UserX;
      default:
        return User;
    }
  };

  const getDonationTypeIcon = (donationType: Donation["donationType"]) => {
    switch (donationType) {
      case "one_time":
        return Gift;
      case "recurring":
        return Repeat;
      case "pledge":
        return HandHeart;
      default:
        return Gift;
    }
  };

  if (!donation) return null;

  const statusBadge = getStatusBadge(donation.status);
  const StatusIcon = statusBadge.icon;
  const DonorTypeIcon = getDonorTypeIcon(donation.donorType);
  const DonationTypeIcon = getDonationTypeIcon(donation.donationType);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 shrink-0" />
            Donation Details
          </DialogTitle>
          <DialogDescription>View detailed information about this donation</DialogDescription>
        </DialogHeader>

        <Separator />

        <div className="space-y-6">
          {/* Donor Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Donor Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1 sm:space-y-2">
                <div className="flex items-center gap-2">
                  <DonorTypeIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm font-medium">Donor Name</span>
                </div>
                <p className="text-sm break-words">{donation.donorName}</p>
              </div>
              <div className="space-y-1 sm:space-y-2">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm font-medium">Email</span>
                </div>
                <p className="text-sm break-all">{donation.donorEmail}</p>
              </div>
              <div className="space-y-1 sm:space-y-2">
                <div className="flex items-center gap-2">
                  <DonorTypeIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm font-medium">Donor Type</span>
                </div>
                <Badge variant="outline" className="w-fit capitalize">
                  {donation.donorType}
                </Badge>
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
          </div>

          <Separator />

          {/* Donation Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Donation Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1 sm:space-y-2">
                <div className="flex items-center gap-2">
                  <DonationTypeIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm font-medium">Donation Type</span>
                </div>
                <Badge variant="outline" className="w-fit capitalize">
                  {donation.donationType.replace("_", " ")}
                </Badge>
              </div>
              <div className="space-y-1 sm:space-y-2">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm font-medium">Campaign</span>
                </div>
                <p className="text-sm break-words">{donation.campaign || "General"}</p>
              </div>
              <div className="space-y-1 sm:space-y-2">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm font-medium">Amount</span>
                </div>
                <p className="text-lg font-semibold">{formatCurrency(donation.amount)}</p>
              </div>
              <div className="space-y-1 sm:space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm font-medium">Donation Date</span>
                </div>
                <p className="text-sm">{new Date(donation.donationDate).toLocaleDateString()}</p>
              </div>
            </div>

            {donation.paymentMethod && (
              <div className="space-y-1 sm:space-y-2">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm font-medium">Payment Method</span>
                </div>
                <p className="text-sm break-words">{donation.paymentMethod}</p>
              </div>
            )}

            {donation.transactionId && (
              <div className="space-y-1 sm:space-y-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm font-medium">Transaction ID</span>
                </div>
                <p className="text-sm font-mono break-all">{donation.transactionId}</p>
              </div>
            )}

            {donation.notes && (
              <div className="space-y-1 sm:space-y-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm font-medium">Notes</span>
                </div>
                <p className="text-sm break-words">{donation.notes}</p>
              </div>
            )}
          </div>

          <Separator />

          {/* Receipt Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Receipt Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1 sm:space-y-2">
                <div className="flex items-center gap-2">
                  <Send className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm font-medium">Receipt Status</span>
                </div>
                <div className="flex items-center gap-2">
                  {donation.receiptSent ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <Clock className="h-4 w-4 text-yellow-600" />
                  )}
                  <span className="text-sm">{donation.receiptSent ? "Sent" : "Not Sent"}</span>
                </div>
              </div>
              <div className="space-y-1 sm:space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm font-medium">Created Date</span>
                </div>
                <p className="text-sm">{new Date(donation.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Payment History */}
          {payments.filter((payment) => payment.donationId === donation.id).length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Payment History</h3>
              <div className="space-y-3">
                {payments
                  .filter((payment) => payment.donationId === donation.id)
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

          {/* Actions */}
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
