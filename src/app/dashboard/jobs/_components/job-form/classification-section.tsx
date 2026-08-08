import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  EMPLOYMENT_TYPES,
  EMPLOYMENT_TYPE_LABELS,
  EXPERIENCE_LEVELS,
  EXPERIENCE_LEVEL_LABELS,
  type EmploymentType,
  type ExperienceLevel,
} from "@/types/jobs.types";
import type { JobFormState, SetJobFormField } from "./types";

interface ClassificationSectionProps {
  formData: JobFormState;
  setField: SetJobFormField;
}

export function ClassificationSection({ formData, setField }: ClassificationSectionProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="employmentType">Employment Type</Label>
        <Select
          value={formData.employmentType}
          onValueChange={(value) => setField("employmentType", value as EmploymentType)}
        >
          <SelectTrigger id="employmentType">
            <SelectValue placeholder="Select employment type" />
          </SelectTrigger>
          <SelectContent>
            {EMPLOYMENT_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {EMPLOYMENT_TYPE_LABELS[type]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="experienceLevel">Experience Level</Label>
        <Select
          value={formData.experienceLevel}
          onValueChange={(value) => setField("experienceLevel", value as ExperienceLevel)}
        >
          <SelectTrigger id="experienceLevel">
            <SelectValue placeholder="Select experience level" />
          </SelectTrigger>
          <SelectContent>
            {EXPERIENCE_LEVELS.map((level) => (
              <SelectItem key={level} value={level}>
                {EXPERIENCE_LEVEL_LABELS[level]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
