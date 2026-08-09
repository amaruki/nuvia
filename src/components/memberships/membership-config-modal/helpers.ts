import type { MembershipConfig } from "./types";

export const defaultMembershipConfig: MembershipConfig = {
  defaultTier: "basic",
  trialPeriodDays: 14,
  autoRenewal: true,
  cancellationPolicy: "30 days notice required",
  paymentGateway: "stripe",
  currency: "USD",
  welcomeEmail: true,
  upgradeReminders: true,
  renewalReminders: true,
  defaultPermissions: ["read_profile", "join_events"],
};
