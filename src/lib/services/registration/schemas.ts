/**
 * Registration request schemas — the self-register body and the admin list
 * query (status filters, search, pagination).
 */

import { z } from "zod";
import { registrationStatusEnum } from "@/db/schema/enums";

export const createRegistrationSchema = z.object({
  notes: z.string().trim().max(2_000, "Notes must be at most 2,000 characters").optional(),
});

export type CreateRegistrationInput = z.infer<typeof createRegistrationSchema>;

export const listRegistrationsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.array(z.enum(registrationStatusEnum.enumValues)).min(1).optional(),
  search: z.string().trim().min(1).max(200).optional(),
});

export type ListRegistrationsQuery = z.infer<typeof listRegistrationsQuerySchema>;
