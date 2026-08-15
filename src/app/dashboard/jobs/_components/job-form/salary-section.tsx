import { useFormContext } from "react-hook-form";

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { JobPostingFormValues } from "@/lib/validation/job.validation";

/**
 * Compensation keeps the schema's string-backed salary values (NumberField
 * would coerce them to numbers), so the fields compose the ui/form
 * primitives directly per the form-kit escape hatch.
 */
export function SalarySection() {
  const { control } = useFormContext<JobPostingFormValues>();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <FormField
        control={control}
        name="salaryMin"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Salary Min</FormLabel>
            <FormControl>
              <Input type="number" min={0} step={0.01} placeholder="e.g. 60000" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="salaryMax"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Salary Max</FormLabel>
            <FormControl>
              <Input type="number" min={0} step={0.01} placeholder="e.g. 80000" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="currency"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Currency</FormLabel>
            <FormControl>
              <Input
                maxLength={3}
                placeholder="USD"
                {...field}
                onChange={(event) => field.onChange(event.target.value.toUpperCase())}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
