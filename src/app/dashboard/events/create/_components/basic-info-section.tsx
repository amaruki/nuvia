"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EventType } from "@/types/event";

import type { CreateEventFormData, FormInputChangeHandler } from "./create-event-types";

const eventTypeOptions = [
  { value: EventType.WORKSHOP, label: "Workshop" },
  { value: EventType.MEETUP, label: "Meetup" },
  { value: EventType.CONFERENCE, label: "Conference" },
  { value: EventType.WEBINAR, label: "Webinar" },
  { value: EventType.SOCIAL, label: "Social" },
  { value: EventType.TRAINING, label: "Training" },
  { value: EventType.OTHER, label: "Other" },
];

interface BasicInfoSectionProps {
  formData: CreateEventFormData;
  onInputChange: FormInputChangeHandler;
}

/** Title, descriptions, and event type fields. */
export function BasicInfoSection({ formData, onInputChange }: BasicInfoSectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-foreground/90">Basic Information</h3>

      <div>
        <Label htmlFor="title">Event Title</Label>
        <Input
          id="title"
          name="title"
          value={formData.title}
          onChange={onInputChange}
          required
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="shortDescription">Short Description</Label>
        <Input
          id="shortDescription"
          name="shortDescription"
          value={formData.shortDescription}
          onChange={onInputChange}
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="description">Full Description</Label>
        <Textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={onInputChange}
          rows={5}
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="eventType">Event Type</Label>
        <select
          id="eventType"
          name="eventType"
          value={formData.eventType}
          onChange={onInputChange}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-input focus:outline-none focus:ring-ring focus:border-primary sm:text-sm rounded-md"
        >
          {eventTypeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
