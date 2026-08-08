import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { JobFormState, SetJobFormField } from "./types";

interface SalarySectionProps {
  formData: JobFormState;
  setField: SetJobFormField;
}

export function SalarySection({ formData, setField }: SalarySectionProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="space-y-2">
        <Label htmlFor="salaryMin">Salary Min</Label>
        <Input
          id="salaryMin"
          type="number"
          min="0"
          step="0.01"
          placeholder="e.g. 60000"
          value={formData.salaryMin}
          onChange={(e) => setField("salaryMin", e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="salaryMax">Salary Max</Label>
        <Input
          id="salaryMax"
          type="number"
          min="0"
          step="0.01"
          placeholder="e.g. 80000"
          value={formData.salaryMax}
          onChange={(e) => setField("salaryMax", e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="currency">Currency</Label>
        <Input
          id="currency"
          maxLength={3}
          placeholder="USD"
          value={formData.currency}
          onChange={(e) => setField("currency", e.target.value.toUpperCase())}
        />
      </div>
    </div>
  );
}
