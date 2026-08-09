import type { ReactNode } from "react";
import type { MembershipTier } from "@/types/membership.types";

export interface TierEditData {
  tier: MembershipTier;
  name: string;
  description: string;
  price: string;
  period: string;
  features: string[];
  benefits: string[];
  memberCount: number;
  status: "active" | "inactive" | "popular";
  icon: ReactNode;
  color: string;
  visibility?: boolean;
  upgradeFrom?: string[];
  upgradeTo?: string[];
  restrictions?: string[];
}

export interface TierFormData {
  name: string;
  description: string;
  price: string;
  period: string;
  status: "active" | "inactive" | "popular";
  color: string;
  visibility: boolean;
  features: string[];
  benefits: string[];
  upgradeFrom: string[];
  upgradeTo: string[];
  restrictions: string[];
}

/** Shape passed to onSave: the original tier merged with the edited form fields */
export type TierSavePayload = TierEditData & TierFormData;

export interface TierEditModalProps {
  tier: TierEditData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (tier: TierSavePayload) => void;
}
