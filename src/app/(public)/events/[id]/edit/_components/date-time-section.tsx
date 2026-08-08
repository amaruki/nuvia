/**
 * "Date and Time" section of the event edit form: start and end date plus
 * the optional registration deadline.
 */

import type { ChangeEvent } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { EventFormData } from "./types";

interface DateTimeSectionProps {
  formData: EventFormData;
  onInputChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

export function DateTimeSection({ formData, onInputChange }: DateTimeSectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-foreground/90">Date and Time</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="startDate">Start Date and Time</Label>
          <Input
            id="startDate"
            name="startDate"
            type="datetime-local"
            value={formData.startDate}
            onChange={onInputChange}
            required
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="endDate">End Date and Time</Label>
          <Input
            id="endDate"
            name="endDate"
            type="datetime-local"
            value={formData.endDate}
            onChange={onInputChange}
            required
            className="mt-1"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="registrationDeadline">Registration Deadline</Label>
        <Input
          id="registrationDeadline"
          name="registrationDeadline"
          type="datetime-local"
          value={formData.registrationDeadline}
          onChange={onInputChange}
          className="mt-1"
        />
      </div>
    </div>
  );
}
