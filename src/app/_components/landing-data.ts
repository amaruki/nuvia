export const GITHUB_URL = "https://github.com/amaruki/nuvia";

export const NAV_LINKS = [
  { href: "#features", label: "Features" },
  { href: "#modules", label: "Modules" },
  { href: "#community", label: "Community" },
  { href: "#contribute", label: "Contribute" },
] as const;

// Animated underline on hover; transform-only so it stays GPU-composited.
export const NAV_LINK_CLASS =
  "relative text-sm text-muted-foreground transition-colors hover:text-foreground after:absolute after:-bottom-1.5 after:left-0 after:h-px after:w-full after:origin-left after:scale-x-0 after:bg-foreground after:transition-transform after:duration-300 hover:after:scale-x-100 motion-reduce:after:transition-none";

export const FOOTER_LINK_CLASS = "text-muted-foreground transition-colors hover:text-foreground";

export const MEMBERS = [
  { initials: "PR", name: "Priya Raman", role: "Committee chair" },
  { initials: "DO", name: "Daniel Okafor", role: "Member" },
  { initials: "SA", name: "Sofia Almeida", role: "Organizer" },
  { initials: "MC", name: "Mei-Lin Chen", role: "Treasurer" },
] as const;

export const PREDEFINED_ROLES = [
  "Superadmin",
  "Admin",
  "Treasurer",
  "Committee chair",
  "Organizer",
  "Member",
] as const;

export const LIVE_MODULES = ["Members", "Events", "Content", "Forums", "Jobs"] as const;

// Promotion order comes from TODO.md: by value to an association.
export const ROADMAP_MODULES = [
  "Finance and dues",
  "Chapters",
  "Committees",
  "Learning",
  "Awards",
  "Workspaces",
] as const;

export const PROMOTION_GATE = ["Schema", "Authorized API", "Tests", "Documentation"] as const;

export const STACK = ["Next.js 16", "React 19", "PostgreSQL", "Drizzle", "Bun"] as const;

export const QUICK_START = [
  "git clone https://github.com/amaruki/nuvia.git",
  "cd nuvia",
  "bun install",
  "cp .env.example .env.local",
  "bun run dev",
] as const;
