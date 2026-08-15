import { SelectField, TextField } from "@/components/dashboard/form-sheet";
import type { JobBoardMeta } from "@/types/jobs.types";

interface BasicInfoSectionProps {
  meta: JobBoardMeta;
}

export function BasicInfoSection({ meta }: BasicInfoSectionProps) {
  return (
    <>
      <TextField
        name="title"
        label="Job Title"
        placeholder="e.g. Senior Frontend Developer"
        required
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SelectField
          name="companyId"
          label="Company"
          placeholder="Select company"
          required
          options={meta.companies.map((company) => ({
            value: company.id,
            label: company.displayName,
          }))}
        />
        <SelectField
          name="locationId"
          label="Location"
          placeholder="Select location"
          required
          options={meta.locations.map((location) => ({
            value: location.id,
            label: location.displayName,
          }))}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SelectField
          name="categoryId"
          label="Job Category"
          placeholder="Select category"
          required
          options={meta.categories.map((category) => ({
            value: category.id,
            label: category.displayName,
          }))}
        />
        <SelectField
          name="typeId"
          label="Job Type"
          placeholder="Select type"
          required
          options={meta.types.map((type) => ({
            value: type.id,
            label: type.displayName,
          }))}
        />
      </div>
    </>
  );
}
