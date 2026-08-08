// Event server action result types for Nuvia community platform

import { Event } from "./event";
import { EventRegistrationResponse, EventCheckInResponse } from "./responses";

export interface CreateEventActionResult {
  success: boolean;
  data?: Event;
  message?: string;
  errors?: Record<string, string[]>;
}

export interface UpdateEventActionResult {
  success: boolean;
  data?: Event;
  message?: string;
  errors?: Record<string, string[]>;
}

export interface DeleteEventActionResult {
  success: boolean;
  message?: string;
  errors?: Record<string, string[]>;
}

export interface RegisterForEventActionResult {
  success: boolean;
  data?: EventRegistrationResponse;
  message?: string;
  errors?: Record<string, string[]>;
}

export interface CancelEventRegistrationActionResult {
  success: boolean;
  data?: EventRegistrationResponse;
  message?: string;
  errors?: Record<string, string[]>;
}

export interface CheckInToEventActionResult {
  success: boolean;
  data?: EventCheckInResponse;
  message?: string;
  errors?: Record<string, string[]>;
}
