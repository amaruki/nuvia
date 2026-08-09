"use client";

import type { ChangeEvent } from "react";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import type {
  EventFormData,
  FormCheckboxChangeHandler,
  FormInputChangeHandler,
} from "./edit-event-types";

interface LocationSectionProps {
  formData: EventFormData;
  onInputChange: FormInputChangeHandler;
  onCheckboxChange: FormCheckboxChangeHandler;
}

/** Location field, in-person/virtual toggles, and the conditional virtual URL. */
export function LocationSection({
  formData,
  onInputChange,
  onCheckboxChange,
}: LocationSectionProps) {
  /** Adapts Radix's boolean callback to the page's event-shaped checkbox handler. */
  const handleCheckedChange = (name: "isInPerson" | "isVirtual", checked: boolean) => {
    onCheckboxChange({ target: { name, checked } } as ChangeEvent<HTMLInputElement>);
  };

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
          <Checkbox
            id="isInPerson"
            checked={formData.isInPerson}
            onCheckedChange={(checked) => handleCheckedChange("isInPerson", checked === true)}
          />
          <Label htmlFor="isInPerson" className="ml-2">
            In-Person Event
          </Label>
        </div>

        <div className="flex items-center">
          <Checkbox
            id="isVirtual"
            checked={formData.isVirtual}
            onCheckedChange={(checked) => handleCheckedChange("isVirtual", checked === true)}
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
