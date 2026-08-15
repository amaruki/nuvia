import type { FieldPath } from "react-hook-form";

import { NumberField, SelectField, TextField } from "@/components/dashboard/form-sheet";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import type { ChapterFormValues } from "@/lib/validation/organization.validation";

import { meetingFrequencyOptions } from "./options";
import type { ChapterFormSectionProps } from "./types";

const toggleFields: { name: FieldPath<ChapterFormValues>; label: string; description: string }[] = [
  {
    name: "settings.allowOnlineRegistration",
    label: "Allow Online Registration",
    description: "Enable new members to register online",
  },
  {
    name: "settings.requireApproval",
    label: "Require Approval",
    description: "Require admin approval for new members",
  },
  {
    name: "settings.autoRenewMembership",
    label: "Auto-Renew Membership",
    description: "Automatically renew memberships",
  },
  {
    name: "settings.sendReminders",
    label: "Send Reminders",
    description: "Send meeting and event reminders",
  },
  {
    name: "settings.publicDirectory",
    label: "Public Directory",
    description: "List chapter in public directory",
  },
];

/**
 * The membership toggles keep their switch-with-description row layout, so
 * they compose FormField directly instead of the CheckboxField shorthand.
 */
export function SettingsSection({ form }: ChapterFormSectionProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <p className="text-sm font-medium">Membership settings</p>
        <div className="grid gap-4 md:grid-cols-2">
          <NumberField
            name="settings.membershipDues"
            label="Annual membership dues ($)"
            required
            placeholder="100"
            min={0}
            step={0.01}
          />
          <SelectField
            name="settings.meetingFrequency"
            label="Meeting frequency"
            required
            placeholder="Select frequency"
            options={meetingFrequencyOptions}
          />
          <TextField name="settings.meetingDay" label="Meeting day" placeholder="Third Thursday" />
          <TextField name="settings.meetingTime" label="Meeting time" placeholder="6:00 PM" />
        </div>
      </div>

      <div className="space-y-4">
        <p className="text-sm font-medium">Chapter settings</p>
        <div className="grid gap-4 md:grid-cols-2">
          {toggleFields.map((toggle) => (
            <FormField
              key={toggle.name}
              control={form.control}
              name={toggle.name}
              render={({ field }) => (
                <FormItem className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <FormLabel>{toggle.label}</FormLabel>
                    <p className="text-muted-foreground text-sm">{toggle.description}</p>
                  </div>
                  <FormControl>
                    <Switch checked={field.value === true} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
