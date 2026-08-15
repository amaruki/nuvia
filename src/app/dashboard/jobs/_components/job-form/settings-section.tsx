import { CheckboxField, TextField } from "@/components/dashboard/form-sheet";

export function SettingsSection() {
  return (
    <>
      <div className="flex flex-col gap-3">
        <CheckboxField name="isRemote" label="Remote friendly" />
        <CheckboxField name="isFeatured" label="Feature on the public job board" />
      </div>

      <TextField
        name="tags"
        label="Tags"
        placeholder="e.g. react, typescript, remote"
        description="Separate tags with commas."
      />
    </>
  );
}
