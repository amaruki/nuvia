import {
  Calendar,
  CheckCircle,
  Clock,
  CreditCard,
  DollarSign,
  FileText,
  Send,
  Target,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { Donation } from "@/types/finance";
import { formatCurrency, getDonationTypeIcon } from "./helpers";

interface DetailsSectionProps {
  donation: Donation;
}

export default function DetailsSection({ donation }: DetailsSectionProps) {
  const DonationTypeIcon = getDonationTypeIcon(donation.donationType);

  return (
    <>
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
    </>
  );
}
