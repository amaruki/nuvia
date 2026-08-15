import {
  NumberField,
  SelectField,
  TextareaField,
  TextField,
} from "@/components/dashboard/form-sheet";

import { categoryOptions, levelOptions } from "./options";

/**
 * Flat course fields, built from the standard field shorthands. Price has
 * no required marker: the schema coerces empty input to 0, so it always
 * validates.
 */
export function BasicInfoSection() {
  return (
    <div className="space-y-4">
      <TextField
        name="title"
        label="Course Title"
        required
        placeholder="e.g. Advanced React Patterns"
        autoComplete="off"
      />
      <TextareaField
        name="description"
        label="Description"
        required
        placeholder="Brief summary of what students will learn..."
        rows={4}
      />
      <div className="grid gap-4 md:grid-cols-2">
        <SelectField
          name="category"
          label="Category"
          required
          options={categoryOptions}
          placeholder="Select a category"
        />
        <SelectField
          name="level"
          label="Level"
          required
          options={levelOptions}
          placeholder="Select difficulty"
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <NumberField
          name="price"
          label="Price ($)"
          min={0}
          step={0.01}
          placeholder="0.00"
          description="Set to 0 for free courses."
        />
        <TextField
          name="image"
          label="Thumbnail URL"
          type="url"
          placeholder="https://example.com/image.jpg"
        />
      </div>
    </div>
  );
}
