export interface MembershipConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (config: MembershipConfig) => void;
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
