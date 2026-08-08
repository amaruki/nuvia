import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { JOB_STATUSES, JOB_STATUS_LABELS, type JobStatus } from "@/types/jobs.types";
import type { JobFormState, SetJobFormField } from "./types";

interface StatusSectionProps {
  formData: JobFormState;
  setField: SetJobFormField;
}

export function StatusSection({ formData, setField }: StatusSectionProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Select
          value={formData.status}
          onValueChange={(value) => setField("status", value as JobStatus)}
        >
          <SelectTrigger id="status">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            {JOB_STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                {JOB_STATUS_LABELS[status]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="applicationDeadline">Application Deadline</Label>
        <Input
          id="applicationDeadline"
          type="date"
          value={formData.applicationDeadline}
          onChange={(e) => setField("applicationDeadline", e.target.value)}
        />
      </div>
    </div>
  );
}
