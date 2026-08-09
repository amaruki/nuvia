import {
  MODULE_FLAGS,
  MODULE_LABELS,
  MODULE_NAMES,
  getDisabledModules,
  getEnabledModules,
  type ModuleName,
} from "../../../config/features";

export const GITHUB_URL = "https://github.com/amaruki/nuvia";

export const NAV_LINKS = [
  { href: "#features", label: "Features" },
  { href: "#modules", label: "Modules" },
  { href: "#community", label: "Community" },
  { href: "#contribute", label: "Contribute" },
  { href: "/news", label: "News" },
  { href: "/docs", label: "Docs" },
  { href: "/forums", label: "Forums" },
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

/**
 * Module claims derive from the maturity registry (config/features.ts,
 * ADR-0008, decision R5): exposure state comes from the flags, never from
 * hand-maintained copy. A module is claimed as live only while its flag is
 * on, and listed on the roadmap only while its flag is off. To change the
 * landing, flip a flag and redeploy; do not edit these lists.
 */
export function deriveModuleLists(flags: Record<ModuleName, boolean> = MODULE_FLAGS) {
  return {
    live: getEnabledModules(flags).map((name) => MODULE_LABELS[name]),
    upcoming: getDisabledModules(flags).map((name) => MODULE_LABELS[name]),
  };
}

const moduleLists = deriveModuleLists();

export const LIVE_MODULES = moduleLists.live;
export const ROADMAP_MODULES = moduleLists.upcoming;

/** Total modules in the maturity registry, for honest "N of M" copy. */
export const REGISTRY_MODULE_COUNT = MODULE_NAMES.length;

export const PROMOTION_GATE = ["Schema", "Authorized API", "Tests", "Documentation"] as const;

export const STACK = ["Next.js 16", "React 19", "PostgreSQL", "Drizzle", "Bun"] as const;

export const QUICK_START = [
  "git clone https://github.com/amaruki/nuvia.git",
  "cd nuvia",
  "bun install",
  "cp .env.example .env.local",
  "bun run dev",
] as const;
