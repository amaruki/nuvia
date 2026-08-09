/**
 * Documentation portal registry (UI-40, decision D14: rendered in-app).
 *
 * The docs/ tree is the single source of truth. This registry maps that
 * tree onto three audiences — users, developers, operators — and derives
 * every title and summary from the files themselves at request time. It
 * never invents content: when a promoted module has no guide, or an
 * operator runbook was never written, the entry says so (status "missing")
 * instead of pointing at a fabricated page.
 */
import { existsSync, readFileSync, readdirSync, statSync } from "fs";
import { join } from "path";
import { getEnabledModules, MODULE_LABELS } from "../../../config/features";

export type DocAudience = "users" | "developers" | "operators";
export type DocStatus = "available" | "missing";

export interface DocEntry {
  audience: DocAudience;
  /** Route slug: /docs/<audience>/<slug>. Unique within the audience. */
  slug: string;
  /** Derived from the file's own first heading; honest label when missing. */
  title: string;
  /** Excerpt of the first real paragraph; fixed honest notice when missing. */
  summary: string;
  /** Absolute path of the backing markdown file, or null when not written. */
  filePath: string | null;
  /** docs/-relative path for display, or null when not written. */
  repoPath: string | null;
  status: DocStatus;
  /** Shown on the /docs landing; hidden entries stay reachable by link. */
  onLanding: boolean;
  /** Short honest label rendered on missing entries. */
  missingBadge?: string;
}

export interface AdrEntry {
  /** Four-digit ADR number, e.g. "0006". */
  number: string;
  /** Title parsed from the file's own "# ADR-NNNN: Title" heading. */
  title: string;
  fileName: string;
  filePath: string;
  /** Detail slug inside the developers audience. */
  slug: string;
}

export const AUDIENCES: readonly DocAudience[] = ["users", "developers", "operators"];

export const AUDIENCE_META: Record<DocAudience, { label: string; description: string }> = {
  users: {
    label: "Users",
    description:
      "Per-module usage guides: what each module does and how to use it on this instance.",
  },
  developers: {
    label: "Developers",
    description:
      "Architecture overview, technical specifications, API conventions, and every recorded architecture decision.",
  },
  operators: {
    label: "Operators",
    description: "Deployment, environment configuration, observability, and maintenance runbooks.",
  },
};

/** The only summary a missing entry may carry — never invented prose. */
export const HONEST_MISSING_SUMMARY =
  "Not written yet — no source file exists in docs/ for this page.";

const REPO_ROOT = process.cwd();
export const DOCS_ROOT = join(REPO_ROOT, "docs");

const ADR_FILE = /^\d{4}-.+\.md$/;
const SPEC_FILE = /^\d{2}-.+\.md$/;
const ADR_HEADING = /^#\s*ADR-(\d{4}):\s*(.+?)\s*$/m;

export function isDocAudience(value: string): value is DocAudience {
  return (AUDIENCES as readonly string[]).includes(value);
}

/* ------------------------------------------------------------------ */
/* Content derivation                                                  */
/* ------------------------------------------------------------------ */

function stripInlineMarkdown(text: string): string {
  return text
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/\\([\\`*_{}[\]()#+\-.!])/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function truncate(text: string, max = 240): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${cut.slice(0, lastSpace > 80 ? lastSpace : max - 1).trimEnd()}…`;
}

/**
 * Title = the file's own first H1; summary = the first real paragraph that
 * follows it, skipping headings, tables, blockquotes, lists, horizontal
 * rules, and bold "Key:" metadata lines. Both come from the file itself.
 */
function readTitleAndSummary(filePath: string): { title: string; summary: string } {
  const lines = readFileSync(filePath, "utf8").split("\n");

  let titleIndex = -1;
  let title = "";
  for (let i = 0; i < lines.length; i += 1) {
    const match = /^#\s+(.+)$/.exec(lines[i].trim());
    if (match) {
      titleIndex = i;
      title = match[1].trim();
      break;
    }
  }

  const isBlockStart = (line: string) =>
    /^(#|\||>|[-*+]\s|\d+\.\s|---)/.test(line) || /^\*\*[^*]{1,48}:\*\*/.test(line);

  let summary = "";
  for (let i = titleIndex + 1; i < lines.length; i += 1) {
    const line = lines[i].trim();
    if (line === "" || isBlockStart(line)) continue;
    const paragraph = [line];
    for (let j = i + 1; j < lines.length; j += 1) {
      const next = lines[j].trim();
      if (next === "" || isBlockStart(next)) break;
      paragraph.push(next);
    }
    summary = truncate(stripInlineMarkdown(paragraph.join(" ")));
    break;
  }

  return { title, summary };
}

function availableEntry(
  audience: DocAudience,
  slug: string,
  repoPath: string,
  options: { onLanding?: boolean } = {},
): DocEntry {
  const filePath = join(DOCS_ROOT, repoPath);
  const { title, summary } = readTitleAndSummary(filePath);
  return {
    audience,
    slug,
    title,
    summary: summary || "See the full document for details.",
    filePath,
    repoPath,
    status: "available",
    onLanding: options.onLanding ?? true,
  };
}

/* ------------------------------------------------------------------ */
/* Users: one entry per promoted module                                */
/* ------------------------------------------------------------------ */

function userEntries(): DocEntry[] {
  return getEnabledModules().map((name) => {
    const repoPath = `modules/${name}.md`;
    if (existsSync(join(DOCS_ROOT, repoPath))) {
      return availableEntry("users", name, repoPath);
    }
    return {
      audience: "users",
      slug: name,
      title: `${MODULE_LABELS[name]} guide`,
      summary: HONEST_MISSING_SUMMARY,
      filePath: null,
      repoPath: null,
      status: "missing",
      onLanding: true,
      missingBadge: "Guide not written yet",
    };
  });
}

/* ------------------------------------------------------------------ */
/* Developers: architecture, specs, API conventions, ADRs              */
/* ------------------------------------------------------------------ */

export function listAdrEntries(): AdrEntry[] {
  const dir = join(DOCS_ROOT, "adr");
  return readdirSync(dir)
    .filter((file) => ADR_FILE.test(file))
    .sort()
    .map((fileName) => {
      const filePath = join(dir, fileName);
      const match = ADR_HEADING.exec(readFileSync(filePath, "utf8"));
      return {
        number: match?.[1] ?? fileName.slice(0, 4),
        title: match?.[2]?.trim() ?? fileName.replace(/\.md$/, ""),
        fileName,
        filePath,
        slug: `adr-${fileName.replace(/\.md$/, "")}`,
      };
    });
}

function developerEntries(): DocEntry[] {
  const entries: DocEntry[] = [
    availableEntry("developers", "architecture-overview", "architecture/overview.md"),
  ];

  const specsDir = join(DOCS_ROOT, "technical-specs");
  entries.push(availableEntry("developers", "spec-index", "technical-specs/_index.md"));
  for (const file of readdirSync(specsDir)
    .filter((f) => SPEC_FILE.test(f))
    .sort()) {
    entries.push(
      availableEntry("developers", `spec-${file.replace(/\.md$/, "")}`, `technical-specs/${file}`),
    );
  }

  entries.push(availableEntry("developers", "api-conventions", "api/conventions.md"));
  entries.push(availableEntry("developers", "adr-index", "adr/README.md"));
  for (const adr of listAdrEntries()) {
    entries.push(
      availableEntry("developers", adr.slug, `adr/${adr.fileName}`, {
        // Keep the landing readable: individual ADRs are linked from the
        // ADR index page rather than listed on /docs.
        onLanding: false,
      }),
    );
  }
  return entries;
}

/* ------------------------------------------------------------------ */
/* Operators: deployment, env config, observability, runbook slots     */
/* ------------------------------------------------------------------ */

const RUNBOOK_SLOTS = [
  { slug: "runbook-backup", tool: "backup", label: "Backup tool runbook" },
  { slug: "runbook-cache", tool: "cache", label: "Cache tool runbook" },
  { slug: "runbook-database", tool: "database", label: "Database tool runbook" },
] as const;

/**
 * Honest discovery: look anywhere under docs/ for a markdown file whose
 * name carries the tool and a runbook-ish marker. Returns null when no
 * such file exists — which is the current truth for all three tools.
 */
function findRunbookFile(tool: string): string | null {
  const stack = [DOCS_ROOT];
  while (stack.length > 0) {
    const dir = stack.pop() as string;
    for (const name of readdirSync(dir).sort()) {
      const full = join(dir, name);
      if (statSync(full).isDirectory()) {
        stack.push(full);
        continue;
      }
      if (!name.endsWith(".md")) continue;
      const lower = full.toLowerCase();
      const runbookish = /runbook|maintenance|operations/.test(lower);
      if (name.toLowerCase().includes(tool) && runbookish) return full;
    }
  }
  return null;
}

function operatorEntries(): DocEntry[] {
  const entries: DocEntry[] = [
    availableEntry("operators", "deployment-plan", "DEPLOYMENT_PLAN.md"),
    availableEntry(
      "operators",
      "environment-configuration",
      "technical-specs/11-environment-configuration.md",
    ),
    availableEntry("operators", "observability", "observability.md"),
  ];

  for (const slot of RUNBOOK_SLOTS) {
    const found = findRunbookFile(slot.tool);
    if (found) {
      const repoPath = found
        .slice(DOCS_ROOT.length + 1)
        .split("\\")
        .join("/");
      entries.push(availableEntry("operators", slot.slug, repoPath));
      continue;
    }
    entries.push({
      audience: "operators",
      slug: slot.slug,
      title: slot.label,
      summary: HONEST_MISSING_SUMMARY,
      filePath: null,
      repoPath: null,
      status: "missing",
      onLanding: true,
      missingBadge: "Runbook not written yet",
    });
  }
  return entries;
}

/* ------------------------------------------------------------------ */
/* Public registry API                                                 */
/* ------------------------------------------------------------------ */

export function listDocsForAudience(audience: DocAudience): DocEntry[] {
  switch (audience) {
    case "users":
      return userEntries();
    case "developers":
      return developerEntries();
    case "operators":
      return operatorEntries();
  }
}

export function getDocEntry(audience: string, slug: string): DocEntry | undefined {
  if (!isDocAudience(audience)) return undefined;
  return listDocsForAudience(audience).find((entry) => entry.slug === slug);
}

/** The in-portal URL for an entry. */
export function docHref(entry: Pick<DocEntry, "audience" | "slug">): string {
  return `/docs/${entry.audience}/${entry.slug}`;
}

/**
 * Map a docs/-relative markdown path to its portal URL, so relative links
 * inside rendered documents (e.g. the specs table of contents) navigate
 * within the portal. Returns null for anything without a portal page.
 */
export function portalHrefForRepoPath(repoPath: string): string | null {
  for (const audience of AUDIENCES) {
    for (const entry of listDocsForAudience(audience)) {
      if (entry.repoPath === repoPath) return docHref(entry);
    }
  }
  return null;
}
