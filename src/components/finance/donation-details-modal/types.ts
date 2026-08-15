import type { Donation, DonationPayment } from "@/types/finance";

/**
 * No donation payments store and no receipt delivery exist yet, so the
 * modal exposes only the status action that the PATCH endpoint backs.
 */
export interface DonationDetailsModalProps {
  donation: Donation | null;
  payments: DonationPayment[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateStatus: (donationId: string, status: Donation["status"]) => void;
}
