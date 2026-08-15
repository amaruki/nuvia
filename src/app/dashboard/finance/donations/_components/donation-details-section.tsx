"use client";

import { DateField, SelectField, TextField } from "@/components/dashboard/form-sheet";

const DONATION_TYPE_OPTIONS = [
  { value: "one_time", label: "One-time" },
  { value: "recurring", label: "Recurring" },
  { value: "pledge", label: "Pledge" },
];

const CURRENCY_OPTIONS = [
  { value: "USD", label: "USD (US Dollar)" },
  { value: "EUR", label: "EUR (Euro)" },
  { value: "GBP", label: "GBP (British Pound)" },
  { value: "CAD", label: "CAD (Canadian Dollar)" },
  { value: "AUD", label: "AUD (Australian Dollar)" },
];

interface DonationDetailsSectionProps {
  /** Edit mode: the money record (amount, currency, date) is immutable. */
  disabled?: boolean;
}

export function DonationDetailsSection({ disabled }: DonationDetailsSectionProps) {
  return (
    <div className="space-y-4">
      <SelectField
        name="donationType"
        label="Donation type"
        options={DONATION_TYPE_OPTIONS}
        required
        disabled={disabled}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          name="amount"
          label="Amount"
          placeholder="250.00"
          description="Decimal amount, e.g. 250.00"
          required
          disabled={disabled}
        />
        <SelectField
          name="currency"
          label="Currency"
          options={CURRENCY_OPTIONS}
          required
          disabled={disabled}
        />
      </div>
      <TextField
        name="campaign"
        label="Campaign"
        placeholder="Annual fund"
        description="Optional campaign label; campaigns are free text until a campaign store exists."
        disabled={disabled}
      />
      <DateField
        name="donationDate"
        label="Donation date"
        description="Leave empty to date the donation today."
        disabled={disabled}
      />
    </div>
  );
}
