/**
 * Event validation schemas using Zod
 */

import { z } from "zod";
import { EventStatus, EventType, RegistrationStatus } from "@/types/event";

// Event status validation
const eventStatusSchema = z.enum(EventStatus, {
  message: "Invalid event status",
});

// Event type validation
const eventTypeSchema = z.enum(EventType, {
  message: "Invalid event type",
});

// Registration status validation
const registrationStatusSchema = z.enum(RegistrationStatus, {
  message: "Invalid registration status",
});

// Base event schema
const baseEventSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(200, "Title must be at most 200 characters"),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(5000, "Description must be at most 5000 characters"),
  shortDescription: z
    .string()
    .max(300, "Short description must be at most 300 characters")
    .optional(),
  eventType: eventTypeSchema,
  status: eventStatusSchema,
  startDate: z.date({
    message: "Start date is required",
  }),
  endDate: z.date({
    message: "End date is required",
  }),
  location: z
    .string()
    .min(3, "Location must be at least 3 characters")
    .max(200, "Location must be at most 200 characters"),
  virtualEventUrl: z.string().url("Invalid virtual event URL").optional().or(z.literal("")),
  isVirtual: z.boolean({
    message: "Is virtual field is required",
  }),
  isInPerson: z.boolean({
    message: "Is in person field is required",
  }),
  maxAttendees: z
    .number()
    .int("Max attendees must be an integer")
    .positive("Max attendees must be positive")
    .optional(),
  registrationDeadline: z
    .date({
      message: "Invalid registration deadline",
    })
    .optional(),
  coverImage: z.string().url("Invalid cover image URL").optional().or(z.literal("")),
  tags: z
    .array(
      z
        .string()
        .min(1, "Tag must be at least 1 character")
        .max(30, "Tag must be at most 30 characters"),
    )
    .max(10, "Maximum 10 tags allowed")
    .default([]),
});

// Create event schema
export const createEventSchema = baseEventSchema
  .refine((data) => data.startDate < data.endDate, {
    message: "Start date must be before end date",
    path: ["endDate"],
  })
  .refine(
    (data) => {
      if (data.registrationDeadline) {
        return data.registrationDeadline < data.startDate;
      }
      return true;
    },
    {
      message: "Registration deadline must be before start date",
      path: ["registrationDeadline"],
    },
  )
  .refine(
    (data) => {
      if (data.isVirtual && !data.virtualEventUrl) {
        return false;
      }
      return true;
    },
    {
      message: "Virtual event URL is required for virtual events",
      path: ["virtualEventUrl"],
    },
  )
  .refine(
    (data) => {
      if (!data.isVirtual && !data.isInPerson) {
        return false;
      }
      return true;
    },
    {
      message: "Event must be either virtual, in-person, or both",
      path: ["isInPerson"],
    },
  );

// Update event schema
export const updateEventSchema = baseEventSchema
  .partial()
  .refine(
    (data) => {
      if (data.startDate && data.endDate && data.startDate >= data.endDate) {
        return false;
      }
      return true;
    },
    {
      message: "Start date must be before end date",
      path: ["endDate"],
    },
  )
  .refine(
    (data) => {
      if (
        data.registrationDeadline &&
        data.startDate &&
        data.registrationDeadline >= data.startDate
      ) {
        return false;
      }
      return true;
    },
    {
      message: "Registration deadline must be before start date",
      path: ["registrationDeadline"],
    },
  )
  .refine(
    (data) => {
      if (data.isVirtual === true && !data.virtualEventUrl) {
        return false;
      }
      return true;
    },
    {
      message: "Virtual event URL is required for virtual events",
      path: ["virtualEventUrl"],
    },
  )
  .refine(
    (data) => {
      if (data.isVirtual === false && data.isInPerson === false) {
        return false;
      }
      return true;
    },
    {
      message: "Event must be either virtual, in-person, or both",
      path: ["isInPerson"],
    },
  );

// Event filter schema
export const eventFilterSchema = z.object({
  status: z.array(eventStatusSchema).optional(),
  eventType: z.array(eventTypeSchema).optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  organizerId: z.string().uuid("Invalid organizer ID").optional(),
  tags: z.array(z.string()).optional(),
  isVirtual: z.boolean().optional(),
  isInPerson: z.boolean().optional(),
  searchQuery: z.string().max(100, "Search query must be at most 100 characters").optional(),
});

// Event registration schema
export const eventRegistrationSchema = z.object({
  eventId: z.string().uuid("Invalid event ID"),
  notes: z.string().max(500, "Notes must be at most 500 characters").optional(),
});

// Event check-in schema
export const eventCheckInSchema = z.object({
  eventId: z.string().uuid("Invalid event ID"),
  registrationId: z.string().uuid("Invalid registration ID").optional(),
  checkInMethod: z.enum(["qr", "manual", "app"], {
    message: "Invalid check-in method",
  }),
  verificationCode: z
    .string()
    .min(1, "Verification code is required")
    .max(50, "Verification code must be at most 50 characters")
    .optional(),
});

// Event certificate schema
export const eventCertificateSchema = z.object({
  eventId: z.string().uuid("Invalid event ID"),
  userId: z.string().uuid("Invalid user ID"),
  templateId: z.string().uuid("Invalid template ID").optional(),
});

// Event statistics query schema
export const eventStatisticsQuerySchema = z.object({
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  organizerId: z.string().uuid("Invalid organizer ID").optional(),
  eventType: eventTypeSchema.optional(),
});

// Types for the validated schemas
export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
export type EventFilterInput = z.infer<typeof eventFilterSchema>;
export type EventRegistrationInput = z.infer<typeof eventRegistrationSchema>;
export type EventCheckInInput = z.infer<typeof eventCheckInSchema>;
export type EventCertificateInput = z.infer<typeof eventCertificateSchema>;
export type EventStatisticsQueryInput = z.infer<typeof eventStatisticsQuerySchema>;
