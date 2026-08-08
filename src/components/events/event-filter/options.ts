import { EventStatus, EventType } from "@/types/event";

export const statusOptions = [
  { value: EventStatus.DRAFT, label: "Draft" },
  { value: EventStatus.PUBLISHED, label: "Published" },
  { value: EventStatus.CANCELLED, label: "Cancelled" },
  { value: EventStatus.COMPLETED, label: "Completed" },
];

export const eventTypeOptions = [
  { value: EventType.WORKSHOP, label: "Workshop" },
  { value: EventType.MEETUP, label: "Meetup" },
  { value: EventType.CONFERENCE, label: "Conference" },
  { value: EventType.WEBINAR, label: "Webinar" },
  { value: EventType.SOCIAL, label: "Social" },
  { value: EventType.TRAINING, label: "Training" },
  { value: EventType.OTHER, label: "Other" },
];

export const tagOptions = [
  "web development",
  "workshop",
  "coding",
  "javascript",
  "community",
  "networking",
  "meetup",
  "technology",
  "react",
  "conference",
  "ui",
  "ux",
  "design",
  "masterclass",
  "javascript",
  "webinar",
  "online",
  "programming",
  "social",
  "team building",
  "fun",
];
