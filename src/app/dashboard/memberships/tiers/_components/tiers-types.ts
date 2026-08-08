import type { ReactNode } from "react";

import type { MembershipTier } from "@/types/membership.types";

export interface TierData {
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

export interface MembershipConfig {
  defaultTier?: string;
  trialPeriodDays: number;
  autoRenewal: boolean;
  cancellationPolicy: string;
  paymentGateway: string;
  currency: string;
  welcomeEmail: boolean;
  upgradeReminders: boolean;
  renewalReminders: boolean;
  defaultPermissions: string[];
}
