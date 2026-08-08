/**
 * Validation schemas for the Organization singleton (ADR-0007).
 *
 * The settings form always submits every field, so all fields are required
 * here — optional-by-omission PATCH semantics would need partial schemas,
 * which nothing consumes yet. Blank strings on the nullable columns are
 * normalized to null so the database stores real NULLs, not "".
 */

import { z } from "zod";

/** Known IANA timezones, computed at import time (keys are runtime-generated). */
const IANA_TIMEZONES = new Set(Intl.supportedValuesOf("timeZone"));

/** Known ISO 4217 currency codes, computed at import time. */
const SUPPORTED_CURRENCIES = new Set(Intl.supportedValuesOf("currency"));

/** Shared by five fields below: the form submits "" for cleared inputs. */
const blankToNull = (value: string): string | null => {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
};

const httpUrl = (value: string): boolean => {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

export const organizationUpdateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Organization name is required")
    .max(200, "Organization name must be at most 200 characters"),

  legalName: z
    .string()
    .max(300, "Legal name must be at most 300 characters")
    .transform(blankToNull),

  logo: z
    .string()
    .max(500, "Logo URL must be at most 500 characters")
    .refine((value) => value.trim() === "" || httpUrl(value.trim()), {
      message: "Logo must be a valid http(s) URL",
    })
    .transform(blankToNull),

  website: z
    .string()
    .max(500, "Website URL must be at most 500 characters")
    .refine((value) => value.trim() === "" || httpUrl(value.trim()), {
      message: "Website must be a valid http(s) URL",
    })
    .transform(blankToNull),

  supportEmail: z
    .string()
    .max(320, "Support email must be at most 320 characters")
    .refine((value) => value.trim() === "" || z.email().safeParse(value.trim()).success, {
      message: "Support email must be a valid email address",
    })
    .transform(blankToNull),

  locale: z
    .string()
    .trim()
    .min(2, "Locale is required")
    .max(35, "Locale must be at most 35 characters")
    .refine(
      (value) => {
        try {
          new Intl.DateTimeFormat(value);
          return true;
        } catch {
          return false;
        }
      },
      { message: "Locale must be a valid BCP 47 language tag" },
    ),

  currency: z
    .string()
    .trim()
    .length(3, "Currency must be a 3-letter ISO 4217 code")
    .transform((value) => value.toUpperCase())
    .refine((value) => SUPPORTED_CURRENCIES.has(value), {
      message: "Currency must be a valid ISO 4217 code",
    }),

  timezone: z
    .string()
    .trim()
    .min(1, "Timezone is required")
    .max(64, "Timezone must be at most 64 characters")
    .refine((value) => IANA_TIMEZONES.has(value), {
      message: "Timezone must be a valid IANA timezone (e.g. Europe/Berlin)",
    }),
});

export type OrganizationUpdateInput = z.infer<typeof organizationUpdateSchema>;
