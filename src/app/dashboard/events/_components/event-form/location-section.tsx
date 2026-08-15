"use client";

import { useFormContext, useWatch } from "react-hook-form";

import { CheckboxField, TextField } from "@/components/dashboard/form-sheet";
import type { EventFormValues } from "@/lib/validation/event.validation";

/** Location field, in-person/virtual toggles, and the conditional virtual URL. */
export function LocationSection() {
  const { control } = useFormContext<EventFormValues>();
  const isVirtual = useWatch({ control, name: "isVirtual" });

  return (
    <div className="space-y-4">
      <TextField name="location" label="Location" required />
      <div className="flex items-center gap-6">
        <CheckboxField name="isInPerson" label="In-Person Event" />
        <CheckboxField name="isVirtual" label="Virtual Event" />
      </div>
      {isVirtual ? <TextField name="virtualEventUrl" label="Virtual Event URL" type="url" /> : null}
    </div>
  );
}
