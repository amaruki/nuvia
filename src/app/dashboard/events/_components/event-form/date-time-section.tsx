"use client";

import { DateTimeField } from "./date-time-field";

/** Start/end and registration-deadline `datetime-local` fields. */
export function DateTimeSection() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <DateTimeField name="startDate" label="Start Date and Time" required />
        <DateTimeField name="endDate" label="End Date and Time" required />
      </div>
      <DateTimeField name="registrationDeadline" label="Registration Deadline" />
    </div>
  );
}
