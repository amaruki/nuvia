"use client";

import { SelectField, TextField } from "@/components/dashboard/form-sheet";

const DONOR_TYPE_OPTIONS = [
  { value: "individual", label: "Individual" },
  { value: "organization", label: "Organization" },
  { value: "anonymous", label: "Anonymous" },
];

interface DonorSectionProps {
  /** Edit mode: donor identity is immutable once recorded. */
  disabled?: boolean;
}

export function DonorSection({ disabled }: DonorSectionProps) {
  return (
    <div className="space-y-4">
      <TextField
        name="donorName"
        label="Donor name"
        placeholder="Jane Doe"
        required
        disabled={disabled}
      />
      <TextField
        name="donorEmail"
        label="Donor email"
        type="email"
        placeholder="jane@example.com"
        required
        disabled={disabled}
      />
      <SelectField
        name="donorType"
        label="Donor type"
        options={DONOR_TYPE_OPTIONS}
        required
        disabled={disabled}
      />
    </div>
  );
}
