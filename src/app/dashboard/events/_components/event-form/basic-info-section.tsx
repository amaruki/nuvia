"use client";

import { SelectField, TextField, TextareaField } from "@/components/dashboard/form-sheet";

import { CategoryField } from "./category-field";
import { EVENT_STATUS_OPTIONS, EVENT_TYPE_OPTIONS } from "./helpers";

export interface BasicInfoSectionProps {
  /** Create shows the category select; edit shows the status select instead. */
  mode: "create" | "edit";
}

/** Title, descriptions, category (create) or status (edit), and event type. */
export function BasicInfoSection({ mode }: BasicInfoSectionProps) {
  return (
    <div className="space-y-4">
      <TextField name="title" label="Event Title" required />
      <TextField name="shortDescription" label="Short Description" />
      <TextareaField name="description" label="Full Description" rows={5} required />
      {mode === "create" ? <CategoryField /> : null}
      {mode === "edit" ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <SelectField
            name="eventType"
            label="Event Type"
            options={EVENT_TYPE_OPTIONS}
            placeholder="Select event type"
          />
          <SelectField name="status" label="Status" options={EVENT_STATUS_OPTIONS} />
        </div>
      ) : (
        <SelectField
          name="eventType"
          label="Event Type"
          options={EVENT_TYPE_OPTIONS}
          placeholder="Select event type"
        />
      )}
    </div>
  );
}
