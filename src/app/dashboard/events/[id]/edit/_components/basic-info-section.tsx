"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { EventStatus, EventType } from "@/types/event";

import type {
  EventFormData,
  FormInputChangeHandler,
  FormSelectChangeHandler,
} from "./edit-event-types";

const eventTypeOptions = [
  { value: EventType.WORKSHOP, label: "Workshop" },
  { value: EventType.MEETUP, label: "Meetup" },
  { value: EventType.CONFERENCE, label: "Conference" },
  { value: EventType.WEBINAR, label: "Webinar" },
  { value: EventType.SOCIAL, label: "Social" },
  { value: EventType.TRAINING, label: "Training" },
  { value: EventType.OTHER, label: "Other" },
];

const statusOptions = [
  { value: EventStatus.DRAFT, label: "Draft" },
  { value: EventStatus.PUBLISHED, label: "Published" },
  { value: EventStatus.CANCELLED, label: "Cancelled" },
  { value: EventStatus.COMPLETED, label: "Completed" },
];

interface BasicInfoSectionProps {
  formData: EventFormData;
  onInputChange: FormInputChangeHandler;
  onSelectChange: FormSelectChangeHandler;
}

/** Title, descriptions, event type and status fields. */
export function BasicInfoSection({
  formData,
  onInputChange,
  onSelectChange,
}: BasicInfoSectionProps) {
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="eventType">Event Type</Label>
          <Select
            value={formData.eventType}
            onValueChange={(value) => onSelectChange("eventType", value)}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select event type" />
            </SelectTrigger>
            <SelectContent>
              {eventTypeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="status">Status</Label>
          <Select
            value={formData.status}
            onValueChange={(value) => onSelectChange("status", value)}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
