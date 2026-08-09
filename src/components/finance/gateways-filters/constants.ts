import type { FilterOption } from "./types";

export const providerOptions: FilterOption[] = [
  { value: "stripe", label: "Stripe" },
  { value: "paypal", label: "PayPal" },
  { value: "square", label: "Square" },
  { value: "adyen", label: "Adyen" },
  { value: "razorpay", label: "Razorpay" },
  { value: "mollie", label: "Mollie" },
  { value: "other", label: "Other" },
];

export const statusOptions: FilterOption[] = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "testing", label: "Testing" },
  { value: "error", label: "Error" },
];

export const environmentOptions: FilterOption[] = [
  { value: "production", label: "Production" },
  { value: "sandbox", label: "Sandbox" },
];

export const currencyOptions: FilterOption[] = [
  { value: "USD", label: "USD - US Dollar" },
  { value: "EUR", label: "EUR - Euro" },
  { value: "GBP", label: "GBP - British Pound" },
  { value: "CAD", label: "CAD - Canadian Dollar" },
  { value: "AUD", label: "AUD - Australian Dollar" },
  { value: "JPY", label: "JPY - Japanese Yen" },
];
