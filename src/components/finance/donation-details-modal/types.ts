import type { Donation, DonationPayment } from "@/types/finance";

export interface DonationDetailsModalProps {
  donation: Donation | null;
  payments: DonationPayment[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRecordPayment: (donationId: string, amount: number, paymentMethod: string) => void;
  onSendReceipt: (donationId: string) => void;
  onUpdateStatus: (donationId: string, status: Donation["status"]) => void;
}
