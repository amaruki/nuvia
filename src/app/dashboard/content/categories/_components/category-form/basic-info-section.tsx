import { TextareaField, TextField } from "@/components/dashboard/form-sheet";

export function BasicInfoSection() {
  return (
    <div className="space-y-4">
      <TextField
        name="name"
        label="Category name"
        required
        placeholder="Webinar"
        autoComplete="off"
      />
      <TextField
        name="slug"
        label="Slug"
        placeholder="webinar"
        description="Leave empty to generate from the name."
        autoComplete="off"
      />
      <TextareaField
        name="description"
        label="Description"
        placeholder="What kind of content belongs in this category?"
        rows={3}
      />
    </div>
  );
}
