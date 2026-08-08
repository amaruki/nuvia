/**
 * "Capacity" section of the event edit form: the optional attendee cap.
 */

import type { ChangeEvent } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { EventFormData } from "./types";

interface CapacitySectionProps {
  formData: EventFormData;
  onInputChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

export function CapacitySection({ formData, onInputChange }: CapacitySectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-foreground/90">Capacity</h3>

      <div>
        <Label htmlFor="maxAttendees">Maximum Attendees (Optional)</Label>
        <Input
          id="maxAttendees"
          name="maxAttendees"
          type="number"
          min="1"
          value={formData.maxAttendees}
          onChange={onInputChange}
          className="mt-1"
        />
      </div>
    </div>
  );
}
