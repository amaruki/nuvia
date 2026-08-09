import { useFormContext } from "react-hook-form";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import type { JobPostingFormValues } from "@/lib/validation/job.validation";

export function SettingsSection() {
  const { control, setValue } = useFormContext<JobPostingFormValues>();

  return (
    <>
      <div className="flex flex-col gap-3">
        <FormField
          control={control}
          name="isRemote"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center gap-2">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={(checked) => setValue("isRemote", checked === true)}
                />
              </FormControl>
              <FormLabel className="font-normal">Remote friendly</FormLabel>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="isFeatured"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center gap-2">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={(checked) => setValue("isFeatured", checked === true)}
                />
              </FormControl>
              <FormLabel className="font-normal">Feature on the public job board</FormLabel>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={control}
        name="tags"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Tags</FormLabel>
            <FormControl>
              <Input placeholder="e.g. react, typescript, remote" {...field} />
            </FormControl>
            <FormDescription>Separate tags with commas.</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}
