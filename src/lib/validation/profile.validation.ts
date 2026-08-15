/**
 * Validation schemas for the profile settings page. The profile form is a
 * settings-style full page (allowed to stay a page), so these schemas are
 * consumed by plain forms, not form sheets — the schema-location rule
 * (CODING_STANDARD "Where schemas live") is the same either way.
 */

import { z } from "zod";

import {
  socialPlatforms,
  type SocialPlatform,
} from "@/app/dashboard/profile/components/social-links-form/platforms";

export const profileFormSchema = z.object({
  displayName: z
    .string()
    .min(1, "Display name is required")
    .max(50, "Display name must be less than 50 characters"),
  bio: z.string().max(500, "Bio must be less than 500 characters").optional(),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be less than 30 characters")
    .optional(),
});

export type ProfileFormData = z.infer<typeof profileFormSchema>;

export const socialLinkSchema = z.object({
  platform: z.string().min(1, "Platform is required"),
  url: z.string().url("Please enter a valid URL"),
  label: z.string().optional(),
});

export const socialLinksFormSchema = z.object({
  links: z.array(socialLinkSchema).optional(),
});

export function validateSocialUrl(platform: SocialPlatform, url: string): boolean {
  const platformConfig = socialPlatforms[platform];
  return platformConfig.pattern.test(url);
}
