import { z } from "zod";

import { socialPlatforms, type SocialPlatform } from "./platforms";

// Social link validation schema
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
