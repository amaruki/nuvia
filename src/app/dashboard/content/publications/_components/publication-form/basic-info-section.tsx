"use client";

import { useFormContext, useWatch } from "react-hook-form";

import {
  DateField,
  SelectField,
  TextareaField,
  TextField,
} from "@/components/dashboard/form-sheet";

import { CATEGORY_OPTIONS, DIFFICULTY_OPTIONS, STATUS_OPTIONS, TYPE_OPTIONS } from "./options";
import type { BasicInfoSectionProps } from "./types";

/** Every control here is data-driven, so the field shorthands cover it. */
export function BasicInfoSection({ authors }: BasicInfoSectionProps) {
  const { control } = useFormContext();
  const status = useWatch({ control, name: "status" });

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <TextField
          name="title"
          label="Title"
          required
          placeholder="Enter publication title"
          autoComplete="off"
        />
        <TextField
          name="slug"
          label="Slug"
          placeholder="publication-url-slug"
          description="Leave empty to generate from the title."
          autoComplete="off"
        />
      </div>

      <TextareaField
        name="excerpt"
        label="Excerpt"
        required
        placeholder="Brief description of the publication"
        rows={3}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <SelectField name="type" label="Type" required placeholder="Type" options={TYPE_OPTIONS} />
        <SelectField
          name="category"
          label="Category"
          required
          placeholder="Category"
          options={CATEGORY_OPTIONS}
        />
        <SelectField name="status" label="Status" placeholder="Status" options={STATUS_OPTIONS} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <SelectField
          name="authorId"
          label="Primary author"
          required
          placeholder="Select author"
          options={authors.map((author) => ({ value: author.id, label: author.name }))}
        />
        <SelectField
          name="difficulty"
          label="Difficulty level"
          placeholder="Difficulty"
          options={DIFFICULTY_OPTIONS}
        />
      </div>

      {/* Issue #17: scheduled content needs a publish date — the scheduled
          publisher promotes the row on that date. */}
      {status === "scheduled" ? (
        <DateField
          name="scheduledFor"
          label="Publish date"
          required
          description="The publication goes live automatically on this date."
        />
      ) : null}
    </div>
  );
}
