import { CheckCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Donation } from "@/types/finance";

interface DonationActionsProps {
  donation: Donation;
  onUpdateStatus: (donationId: string, status: Donation["status"]) => void;
  onOpenChange: (open: boolean) => void;
}

/**
 * Only actions with a backing endpoint: marking a donation completed goes
 * through PATCH /finance/donations/:id. Recording payments and sending
 * receipts had no backing service, so those buttons were removed rather
 * than shipped as dead affordances.
 */
export default function DonationActions({
  donation,
  onUpdateStatus,
  onOpenChange,
}: DonationActionsProps) {
  return (
    <div className="flex flex-col flex-wrap sm:flex-row gap-3 pt-2 sm:pt-4">
      {donation.status !== "completed" && donation.status !== "refunded" && (
        <Button
          variant="outline"
          className="w-full sm:w-auto"
          onClick={() => onUpdateStatus(donation.id, "completed")}
        >
          <CheckCircle className="h-4 w-4 mr-2" />
          Mark as Completed
        </Button>
      )}
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
