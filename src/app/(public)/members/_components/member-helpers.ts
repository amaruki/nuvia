/**
 * Shared helpers for the public member pages (UI-28).
 */

/** Fallback initials for avatars — first letter of the first two words. */
export function nameInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0]?.charAt(0) ?? "";
  const second = parts.length > 1 ? (parts[parts.length - 1]?.charAt(0) ?? "") : "";
  return (first + second).toUpperCase() || "?";
}

/** "Member since" month — explicit locale per CODING_STANDARD.md §10. */
export function formatMemberSince(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
  }).format(date);
}

/** Human label for a stored external-link platform key ("github" → "Github"). */
export function platformLabel(platform: string): string {
  const spaced = platform.replace(/[-_]+/g, " ").trim();
  if (!spaced) return "Link";
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}
