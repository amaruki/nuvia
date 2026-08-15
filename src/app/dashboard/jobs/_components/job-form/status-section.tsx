import { DateField, SelectField } from "@/components/dashboard/form-sheet";
import { JOB_STATUSES, JOB_STATUS_LABELS } from "@/types/jobs.types";

export function StatusSection() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <SelectField
        name="status"
        label="Status"
        placeholder="Select status"
        required
        options={JOB_STATUSES.map((status) => ({
          value: status,
          label: JOB_STATUS_LABELS[status],
        }))}
      />
      <DateField
        name="applicationDeadline"
        label="Application Deadline"
        description="Leave empty to keep applications open without a deadline."
      />
    </div>
  );
}
