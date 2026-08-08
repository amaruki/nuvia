"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import type {
  CreateEventFormData,
  FormCheckboxChangeHandler,
  FormInputChangeHandler,
} from "./create-event-types";

interface LocationSectionProps {
  formData: CreateEventFormData;
  onInputChange: FormInputChangeHandler;
  onCheckboxChange: FormCheckboxChangeHandler;
}

/** Location field, in-person/virtual toggles, and the conditional virtual URL. */
export function LocationSection({
  formData,
  onInputChange,
  onCheckboxChange,
}: LocationSectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-foreground/90">Location</h3>

      <div>
        <Label htmlFor="location">Location</Label>
        <Input
          id="location"
          name="location"
          value={formData.location}
          onChange={onInputChange}
          required
          className="mt-1"
        />
      </div>

      <div className="flex items-center space-x-6">
        <div className="flex items-center">
          <input
            id="isInPerson"
            name="isInPerson"
            type="checkbox"
            checked={formData.isInPerson}
            onChange={onCheckboxChange}
            className="h-4 w-4 text-primary focus:ring-ring border-input rounded"
          />
          <Label htmlFor="isInPerson" className="ml-2">
            In-Person Event
          </Label>
        </div>

        <div className="flex items-center">
          <input
            id="isVirtual"
            name="isVirtual"
            type="checkbox"
            checked={formData.isVirtual}
            onChange={onCheckboxChange}
            className="h-4 w-4 text-primary focus:ring-ring border-input rounded"
          />
          <Label htmlFor="isVirtual" className="ml-2">
            Virtual Event
          </Label>
        </div>
      </div>

      {formData.isVirtual && (
        <div>
          <Label htmlFor="virtualEventUrl">Virtual Event URL</Label>
          <Input
            id="virtualEventUrl"
            name="virtualEventUrl"
            value={formData.virtualEventUrl}
            onChange={onInputChange}
            className="mt-1"
          />
        </div>
      )}
    </div>
  );
}
