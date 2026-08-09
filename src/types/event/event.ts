// Core event entities for Nuvia community platform

import { SafeUser } from "../auth.types";
import { EventRegistrationWindow, EventStatus, EventType, RegistrationStatus } from "./enums";

export interface Event {
  id: string;
  title: string;
  description: string;
  shortDescription?: string;
  eventType: EventType;
  status: EventStatus;
  startDate: Date;
  endDate: Date;
  location: string;
  virtualEventUrl?: string;
  isVirtual: boolean;
  isInPerson: boolean;
  maxAttendees?: number;
  currentAttendees: number;
  registrationDeadline?: Date;
  registrationWindow?: EventRegistrationWindow;
  organizerId: string;
  organizer?: SafeUser;
  coverImage?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface EventRegistration {
  id: string;
  eventId: string;
  userId: string;
  user?: SafeUser;
  status: RegistrationStatus;
  registeredAt: Date;
  checkedInAt?: Date;
  checkInMethod?: "qr" | "manual" | "app";
  certificateIssued: boolean;
  certificateUrl?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface EventCertificate {
  id: string;
  eventId: string;
  event?: Event;
  userId: string;
  user?: SafeUser;
  issuedAt: Date;
  certificateUrl: string;
  verificationCode: string;
  templateId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface EventCheckIn {
  id: string;
  eventId: string;
  event?: Event;
  registrationId: string;
  registration?: EventRegistration;
  userId: string;
  user?: SafeUser;
  checkedInAt: Date;
  checkedInBy: string; // User ID of who performed the check-in
  checkInMethod: "qr" | "manual" | "app";
  ipAddress?: string;
  location?: string;
  createdAt: Date;
}
