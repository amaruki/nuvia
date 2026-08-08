import type { DonationCampaign, DonationFormData } from "@/types/finance";

export interface AddDonationFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: DonationFormData) => void;
  campaigns: DonationCampaign[];
}

export interface DonorInfo {
  name: string;
  email: string;
}
