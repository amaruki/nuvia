import { CreditCard, Wallet, Banknote, Clock } from "lucide-react";

export const CURRENCY_OPTIONS = [
  { value: "USD", label: "USD - US Dollar" },
  { value: "EUR", label: "EUR - Euro" },
  { value: "GBP", label: "GBP - British Pound" },
  { value: "CAD", label: "CAD - Canadian Dollar" },
  { value: "AUD", label: "AUD - Australian Dollar" },
  { value: "JPY", label: "JPY - Japanese Yen" },
];

export const PROVIDER_OPTIONS = [
  { value: "stripe", label: "Stripe" },
  { value: "paypal", label: "PayPal" },
  { value: "square", label: "Square" },
  { value: "adyen", label: "Adyen" },
  { value: "razorpay", label: "Razorpay" },
  { value: "mollie", label: "Mollie" },
  { value: "other", label: "Other" },
];

export const PAYMENT_METHOD_OPTIONS = [
  { value: "credit_card", label: "Credit Card", icon: CreditCard },
  { value: "debit_card", label: "Debit Card", icon: CreditCard },
  { value: "bank_transfer", label: "Bank Transfer", icon: Banknote },
  { value: "digital_wallet", label: "Digital Wallet", icon: Wallet },
  { value: "buy_now_pay_later", label: "Buy Now Pay Later", icon: Clock },
];
