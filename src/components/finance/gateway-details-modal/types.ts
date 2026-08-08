import type { PaymentGateway, GatewayTransaction, GatewayTestResult } from "@/types/finance";

export interface GatewayDetailsModalProps {
  gateway: PaymentGateway | null;
  transactions: GatewayTransaction[];
  testResults: GatewayTestResult[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTest: (gateway: PaymentGateway) => Promise<void>;
  onToggleStatus: (gateway: PaymentGateway, enabled: boolean) => Promise<void>;
  onSetDefault: (gateway: PaymentGateway) => Promise<void>;
}
