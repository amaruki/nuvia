import { EventStatus, EventType, RegistrationStatus } from "@/types/event";

export const getEventTypeColor = (eventType: EventType): string => {
  switch (eventType) {
    case EventType.WORKSHOP:
      return "bg-chart-1/20 text-chart-1";
    case EventType.MEETUP:
      return "bg-chart-3/20 text-chart-3";
    case EventType.CONFERENCE:
      return "bg-chart-2/20 text-chart-2";
    case EventType.WEBINAR:
      return "bg-chart-5/20 text-chart-5";
    case EventType.SOCIAL:
      return "bg-chart-4/20 text-chart-4";
    case EventType.TRAINING:
      return "bg-destructive/20 text-destructive";
    default:
      return "bg-gray-100 text-foreground/80";
  }
};

export const getEventStatusColor = (status: EventStatus): string => {
  switch (status) {
    case EventStatus.DRAFT:
      return "bg-muted text-muted-foreground";
    case EventStatus.PUBLISHED:
      return "bg-chart-3/20 text-chart-3";
    case EventStatus.CANCELLED:
      return "bg-destructive/20 text-destructive";
    case EventStatus.COMPLETED:
      return "bg-chart-1/20 text-chart-1";
    default:
      return "bg-gray-100 text-foreground/80";
  }
};

export const getRegistrationStatusColor = (status: RegistrationStatus): string => {
  switch (status) {
    case RegistrationStatus.PENDING:
      return "bg-chart-4/20 text-chart-4";
    case RegistrationStatus.CONFIRMED:
      return "bg-chart-3/20 text-chart-3";
    case RegistrationStatus.CANCELLED:
      return "bg-destructive/20 text-destructive";
    case RegistrationStatus.WAITLISTED:
      return "bg-chart-1/20 text-chart-1";
    default:
      return "bg-gray-100 text-foreground/80";
  }
};

export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
};

export const formatTime = (date: Date): string => {
  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};
