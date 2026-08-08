// Event API response types for Nuvia community platform

import { Event, EventRegistration, EventCheckIn, EventCertificate } from "./event";

export interface EventListResponse {
  events: Event[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface EventDetailsResponse {
  event: Event;
  isRegistered: boolean;
  registration?: EventRegistration;
  organizerEvents: Event[]; // Other events by the same organizer
  similarEvents: Event[];
}

export interface EventRegistrationResponse {
  success: boolean;
  message: string;
  data?: {
    registration: EventRegistration;
    event: Event;
  };
  errors?: Record<string, string[]>;
  meta?: {
    timestamp: Date;
    version: string;
  };
}

export interface EventCheckInResponse {
  success: boolean;
  message: string;
  data?: {
    checkIn: EventCheckIn;
    registration: EventRegistration;
    certificate?: EventCertificate;
  };
  errors?: Record<string, string[]>;
  meta?: {
    timestamp: Date;
    version: string;
  };
}
