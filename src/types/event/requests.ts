// Event request payload types for Nuvia community platform

import { EventStatus, EventType } from "./enums";

export interface CreateEventRequest {
  title: string;
  description: string;
  shortDescription?: string;
  category?: string;
  eventType: EventType;
  startDate: Date;
  endDate: Date;
  location: string;
  virtualEventUrl?: string;
  isVirtual: boolean;
  isInPerson: boolean;
  maxAttendees?: number;
  registrationDeadline?: Date;
  coverImage?: string;
  tags: string[];
}

export interface UpdateEventRequest {
  title?: string;
  description?: string;
  shortDescription?: string;
  category?: string;
  eventType?: EventType;
  startDate?: Date;
  endDate?: Date;
  location?: string;
  virtualEventUrl?: string;
  isVirtual?: boolean;
  isInPerson?: boolean;
  maxAttendees?: number;
  registrationDeadline?: Date;
  status?: EventStatus;
  coverImage?: string;
  tags?: string[];
}

export interface RegisterForEventRequest {
  eventId: string;
  notes?: string;
}

export interface CheckInToEventRequest {
  eventId: string;
  registrationId?: string;
  checkInMethod: "qr" | "manual" | "app";
  verificationCode?: string; // For QR code check-ins
}
