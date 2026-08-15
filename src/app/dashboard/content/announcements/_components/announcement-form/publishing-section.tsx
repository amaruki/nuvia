"use client";

import { CheckboxField, SelectField } from "@/components/dashboard/form-sheet";

import { STATUS_OPTIONS, VISIBILITY_OPTIONS } from "./options";

/** Status, visibility, and the flags that control prominence. */
export function PublishingSection() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <SelectField
          name="status"
          label="Status"
          placeholder="Select status"
          options={STATUS_OPTIONS}
        />
        <SelectField
          name="visibility"
          label="Visibility"
          placeholder="Select visibility"
          options={VISIBILITY_OPTIONS}
        />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <CheckboxField name="isPinned" label="Pin to top" />
        <CheckboxField name="isUrgent" label="Mark as urgent" />
        <CheckboxField name="requiresAcknowledgment" label="Require acknowledgment" />
        <CheckboxField name="isFeatured" label="Feature announcement" />
      </div>
    </div>
  );
}
