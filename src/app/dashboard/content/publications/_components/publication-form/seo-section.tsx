"use client";

import { TextareaField, TextField } from "@/components/dashboard/form-sheet";

/**
 * SEO metadata. Title and description are required by
 * publicationFormSchema, so they carry the required marker.
 */
export function SeoSection() {
  return (
    <div className="max-w-2xl space-y-4">
      <TextField
        name="seo.title"
        label="SEO title"
        required
        placeholder="Search engine title"
        description="Keep it under 60 characters."
        autoComplete="off"
      />
      <TextareaField
        name="seo.description"
        label="Meta description"
        required
        rows={4}
        placeholder="Description for search results..."
        description="Keep it under 160 characters."
      />
    </div>
  );
}
