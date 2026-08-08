// Payment Gateway related types
export interface PaymentGateway {
  id: string;
  name: string;
  provider: "stripe" | "paypal" | "square" | "adyen" | "razorpay" | "mollie" | "other";
  displayName: string;
  description?: string;
  status: "active" | "inactive" | "testing" | "error";
  environment: "sandbox" | "production";
  currencies: string[];
  supportedPaymentMethods: PaymentMethod[];
  transactionFees: TransactionFee[];
  webhookUrl?: string;
  apiKey?: string; // Only for display purposes, never expose actual keys
  apiSecret?: string; // Only for display purposes, never expose actual keys
  merchantId?: string;
  accountId?: string;
  isDefault: boolean;
  isEnabled: boolean;
  configuration: GatewayConfiguration;
  statistics: GatewayStatistics;
  createdAt: Date;
  updatedAt: Date;
  lastTestedAt?: Date;
  createdBy: string;
  updatedBy?: string;
}

export interface PaymentMethod {
  id: string;
  type:
    | "credit_card"
    | "debit_card"
    | "bank_transfer"
    | "digital_wallet"
    | "cryptocurrency"
    | "buy_now_pay_later";
  name: string;
  displayName: string;
  isEnabled: boolean;
  supportedNetworks?: string[]; // e.g., ['visa', 'mastercard', 'amex']
  icon?: string;
}

export interface TransactionFee {
  id: string;
  type: "fixed" | "percentage" | "tiered" | "mixed";
  name: string;
  description?: string;
  amount?: number; // For fixed fees
  percentage?: number; // For percentage fees
  minAmount?: number; // Minimum fee amount
  maxAmount?: number; // Maximum fee amount
  tiers?: FeeTier[]; // For tiered fees
  currency: string;
  appliesTo: string[]; // Payment method types this applies to
  isActive: boolean;
}

export interface FeeTier {
  fromAmount: number;
  toAmount?: number;
  fee: number;
  feeType: "fixed" | "percentage";
}

export interface GatewayConfiguration {
  allowPartialPayments: boolean;
  requireCvv: boolean;
  require3ds: boolean;
  autoCapture: boolean;
  settlementDelay: number; // in hours
  refundPolicy: "full" | "partial" | "none";
  disputeManagement: boolean;
  fraudDetection: boolean;
  recurringPayments: boolean;
  subscriptionSupport: boolean;
  maxTransactionAmount: number;
  minTransactionAmount: number;
  dailyTransactionLimit: number;
  monthlyTransactionLimit: number;
  webhookRetries: number;
  timeoutDuration: number; // in seconds
}

export interface GatewayStatistics {
  totalTransactions: number;
  totalVolume: number;
  successRate: number;
  averageTransactionValue: number;
  totalFees: number;
  chargebackCount: number;
  refundCount: number;
  dailyTransactions: Array<{
    date: string;
    count: number;
    volume: number;
  }>;
  monthlyTransactions: Array<{
    month: string;
    count: number;
    volume: number;
  }>;
  paymentMethodBreakdown: Array<{
    method: string;
    count: number;
    volume: number;
  }>;
  errorRates: Array<{
    errorType: string;
    count: number;
    percentage: number;
  }>;
}

export interface GatewayTransaction {
  id: string;
  gatewayId: string;
  gatewayName: string;
  transactionId: string;
  externalTransactionId?: string;
  amount: number;
  currency: string;
  status:
    | "pending"
    | "processing"
    | "completed"
    | "failed"
    | "cancelled"
    | "refunded"
    | "chargeback";
  paymentMethod: string;
  paymentMethodType: string;
  customerEmail?: string;
  customerName?: string;
  description?: string;
  feeAmount: number;
  netAmount: number;
  refundAmount?: number;
  chargebackAmount?: number;
  errorReason?: string;
  processedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface GatewayTestResult {
  gatewayId: string;
  testType: "connection" | "payment" | "webhook" | "refund";
  status: "success" | "failed" | "warning";
  message: string;
  details?: any;
  testedAt: Date;
  duration: number; // in milliseconds
}

export interface GatewayOverallStatistics {
  totalGateways: number;
  activeGateways: number;
  inactiveGateways: number;
  testingGateways: number;
  errorGateways: number;
  totalTransactions: number;
  totalVolume: number;
  averageSuccessRate: number;
  totalFees: number;
  gatewayBreakdown: Array<{
    gatewayId: string;
    gatewayName: string;
    provider: string;
    status: string;
    transactionCount: number;
    volume: number;
    successRate: number;
    fees: number;
  }>;
  monthlyTrend: Array<{
    month: string;
    transactionCount: number;
    volume: number;
    successRate: number;
  }>;
  paymentMethodUsage: Array<{
    method: string;
    count: number;
    percentage: number;
  }>;
}

export interface GatewayFilterOptions {
  status?: string[];
  provider?: string[];
  environment?: string[];
  currency?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  search?: string;
}

export interface GatewayFormData {
  name: string;
  provider: "stripe" | "paypal" | "square" | "adyen" | "razorpay" | "mollie" | "other";
  displayName: string;
  description?: string;
  environment: "sandbox" | "production";
  currencies: string[];
  apiKey?: string;
  apiSecret?: string;
  merchantId?: string;
  accountId?: string;
  webhookUrl?: string;
  isDefault: boolean;
  isEnabled: boolean;
  configuration: Partial<GatewayConfiguration>;
  transactionFees: Partial<TransactionFee>[];
}
