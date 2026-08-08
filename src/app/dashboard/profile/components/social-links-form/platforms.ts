// lucide-react v1 dropped all brand/logo icons (Github, Linkedin, Twitter,
// Instagram, Youtube, Facebook) — see TODO.md. These are generic stand-ins,
// not brand marks; swap to a dedicated icon set (e.g. simple-icons) to
// restore recognizable per-platform icons.
import {
  Code as Github,
  Link2 as Linkedin,
  MessageCircle as Twitter,
  Globe,
  Image as Instagram,
  Video as Youtube,
  Users as Facebook,
} from "lucide-react";

// Predefined social platforms with validation patterns
export const socialPlatforms = {
  twitter: {
    name: "Twitter",
    icon: Twitter,
    baseUrl: "https://twitter.com/",
    pattern: /^https?:\/\/(www\.)?twitter\.com\/.+/,
    color: "text-[#1DA1F2]",
  },
  linkedin: {
    name: "LinkedIn",
    icon: Linkedin,
    baseUrl: "https://linkedin.com/in/",
    pattern: /^https?:\/\/(www\.)?linkedin\.com\/in\/.+/,
    color: "text-[#0077B5]",
  },
  github: {
    name: "GitHub",
    icon: Github,
    baseUrl: "https://github.com/",
    pattern: /^https?:\/\/(www\.)?github\.com\/.+/,
    color: "text-[#333333]",
  },
  instagram: {
    name: "Instagram",
    icon: Instagram,
    baseUrl: "https://instagram.com/",
    pattern: /^https?:\/\/(www\.)?instagram\.com\/.+/,
    color: "text-[#E4405F]",
  },
  youtube: {
    name: "YouTube",
    icon: Youtube,
    baseUrl: "https://youtube.com/",
    pattern: /^https?:\/\/(www\.)?youtube\.com\/.+/,
    color: "text-[#FF0000]",
  },
  facebook: {
    name: "Facebook",
    icon: Facebook,
    baseUrl: "https://facebook.com/",
    pattern: /^https?:\/\/(www\.)?facebook\.com\/.+/,
    color: "text-[#1877F2]",
  },
  website: {
    name: "Website",
    icon: Globe,
    baseUrl: "https://",
    pattern: /^https?:\/\/.+/,
    color: "text-blue-600",
  },
} as const;

export type SocialPlatform = keyof typeof socialPlatforms;

export type SocialLink = {
  id?: string;
  platform: SocialPlatform;
  url: string;
  label?: string;
};

// OAuth account record as attached to the session user by the auth provider.
export type OAuthAccount = { provider: string };

// Older profiles store each external link as a bare URL string, newer ones as
// an object with a url and optional label.
export type StoredLinkValue = string | { url: string; label?: string };

export function parseExternalLinks(
  externalLinks: Record<string, StoredLinkValue> | undefined,
): SocialLink[] {
  if (!externalLinks) {
    return [];
  }

  return Object.entries(externalLinks).map(([key, value]) => ({
    id: key,
    platform: key as SocialPlatform,
    url: typeof value === "string" ? value : value.url,
    label: typeof value === "string" ? undefined : value.label,
  }));
}
