import { SelectField } from "@/components/dashboard/form-sheet";
import {
  EMPLOYMENT_TYPES,
  EMPLOYMENT_TYPE_LABELS,
  EXPERIENCE_LEVELS,
  EXPERIENCE_LEVEL_LABELS,
} from "@/types/jobs.types";

export function ClassificationSection() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <SelectField
        name="employmentType"
        label="Employment Type"
        placeholder="Select employment type"
        required
        options={EMPLOYMENT_TYPES.map((type) => ({
          value: type,
          label: EMPLOYMENT_TYPE_LABELS[type],
        }))}
      />
      <SelectField
        name="experienceLevel"
        label="Experience Level"
        placeholder="Select experience level"
        required
        options={EXPERIENCE_LEVELS.map((level) => ({
          value: level,
          label: EXPERIENCE_LEVEL_LABELS[level],
        }))}
      />
    </div>
  );
}
