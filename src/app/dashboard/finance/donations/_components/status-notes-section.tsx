"use client";

import { SelectField, TextareaField } from "@/components/dashboard/form-sheet";

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "completed", label: "Completed" },
  { value: "pledged", label: "Pledged" },
  { value: "failed", label: "Failed" },
  { value: "refunded", label: "Refunded" },
];

export function StatusNotesSection() {
  return (
    <div className="space-y-4">
      <SelectField name="status" label="Status" options={STATUS_OPTIONS} required />
      <TextareaField
        name="notes"
        label="Notes"
        placeholder="Internal notes about this donation"
        description="Visible to staff only."
      />
    </div>
  );
}
