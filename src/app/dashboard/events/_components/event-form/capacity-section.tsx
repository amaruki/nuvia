"use client";

import { NumberField } from "@/components/dashboard/form-sheet";

/** Optional maximum-attendees field. */
export function CapacitySection() {
  return (
    <div className="space-y-4">
      <NumberField name="maxAttendees" label="Maximum Attendees (Optional)" min={1} />
    </div>
  );
}
