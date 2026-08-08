/**
 * Request schemas for the event write routes — enum sets are read from the
 * drizzle pgEnum definitions so the API vocabulary always matches the
 * database.
 */

import { z } from "zod";
import {
  eventFormatEnum,
  eventStatusEnum,
  eventTypeEnum,
  eventVisibilityEnum,
} from "@/db/schema/enums";

const slugField = z
  .string()
  .trim()
  .min(3)
  .max(200)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase letters, digits and dashes");

const eventFields = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(200),
  slug: slugField.optional(),
  description: z.string().min(10, "Description must be at least 10 characters").max(20_000),
  shortDescription: z.string().max(500).optional(),
  /** Event category — accepts either the category id or its unique name. */
  category: z.string().trim().min(1, "Category is required"),
  type: z.enum(eventTypeEnum.enumValues),
  format: z.enum(eventFormatEnum.enumValues),
  status: z.enum(eventStatusEnum.enumValues).default("DRAFT"),
  visibility: z.enum(eventVisibilityEnum.enumValues).default("PUBLIC"),
  capacity: z.number().int().positive("Capacity must be a positive integer").nullish(),
  isVirtual: z.boolean().default(false),
  isFree: z.boolean().default(true),
  price: z.number({ error: "Price must be a number" }).nonnegative().max(99_999_999.99).optional(),
  currency: z
    .string()
    .length(3, "Currency must be a 3-letter ISO code")
    .toUpperCase()
    .default("USD"),
  location: z.string().trim().max(500).optional(),
  virtualUrl: z.url({ error: "Virtual URL must be a valid URL" }).optional(),
  timezone: z.string().trim().min(1).default("UTC"),
  startTime: z.coerce.date({ error: "startTime must be a valid date" }),
  endTime: z.coerce.date({ error: "endTime must be a valid date" }),
  registrationStart: z.coerce.date({ error: "registrationStart must be a valid date" }).optional(),
  registrationEnd: z.coerce.date({ error: "registrationEnd must be a valid date" }).optional(),
  allowWaitlist: z.boolean().default(true),
  requiresApproval: z.boolean().default(false),
  tags: z.array(z.string().trim().min(1).max(50)).max(20).default([]),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const createEventSchema = eventFields.superRefine((data, ctx) => {
  if (data.endTime <= data.startTime) {
    ctx.addIssue({
      code: "custom",
      message: "endTime must be after startTime",
      path: ["endTime"],
    });
  }
  if (
    data.registrationStart &&
    data.registrationEnd &&
    data.registrationEnd <= data.registrationStart
  ) {
    ctx.addIssue({
      code: "custom",
      message: "registrationEnd must be after registrationStart",
      path: ["registrationEnd"],
    });
  }
  if (!data.isFree && data.price === undefined) {
    ctx.addIssue({
      code: "custom",
      message: "price is required when isFree is false",
      path: ["price"],
    });
  }
});

export type CreateEventInput = z.infer<typeof createEventSchema>;

/**
 * PATCH accepts any subset; counters (registeredCount/waitlistCount) are
 * never user-editable. `category` re-resolves the FK when present.
 */
export const updateEventSchema = eventFields
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  })
  .superRefine((data, ctx) => {
    // Cross-field checks apply only when both sides of a pair are present;
    // pairs straddling the stored row are validated in updateEvent().
    if (data.startTime && data.endTime && data.endTime <= data.startTime) {
      ctx.addIssue({
        code: "custom",
        message: "endTime must be after startTime",
        path: ["endTime"],
      });
    }
    if (
      data.registrationStart &&
      data.registrationEnd &&
      data.registrationEnd <= data.registrationStart
    ) {
      ctx.addIssue({
        code: "custom",
        message: "registrationEnd must be after registrationStart",
        path: ["registrationEnd"],
      });
    }
  });

export type UpdateEventInput = z.infer<typeof updateEventSchema>;
