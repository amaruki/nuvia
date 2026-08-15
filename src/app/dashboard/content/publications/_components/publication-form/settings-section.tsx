"use client";

import { CheckboxField, SelectField } from "@/components/dashboard/form-sheet";

import { VISIBILITY_OPTIONS } from "./options";

/** Access / visibility and interaction toggles. */
export function SettingsSection() {
  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div className="space-y-4">
        <h4 className="text-sm font-medium">Access &amp; visibility</h4>
        <SelectField
          name="visibility"
          label="Visibility"
          placeholder="Select visibility"
          options={VISIBILITY_OPTIONS}
        />
        <CheckboxField name="isFeatured" label="Feature this publication" />
      </div>

      <div className="space-y-4">
        <h4 className="text-sm font-medium">Capabilities</h4>
        <CheckboxField name="commentsEnabled" label="Enable comments" />
        <CheckboxField name="sharingEnabled" label="Enable social sharing" />
      </div>
    </div>
  );
}
