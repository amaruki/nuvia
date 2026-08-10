/**
 * UI-40 Documentation portal guards (docs/planning/03-frontend-improvement-plan.md
 * lines 143-147, decision D14: rendered in-app).
 *
 * The portal renders docs/ content that already exists. These tests guard:
 *   1. the registry covers exactly the three audiences (users, developers,
 *      operators) and is non-empty for each;
 *   2. every "available" registry entry resolves to a real file under docs/;
 *   3. the ADR index is derived from the docs/adr directory itself — same
 *      files, same numbers, titles parsed from each file's own heading;
 *   4. detail rendering returns markdown-derived HTML for at least one doc
 *      per audience (GFM tables included);
 *   5. honesty: promoted modules without a guide are listed as missing, never
 *      fabricated — no invented guide slugs, no invented content, and the
 *      operator runbook gaps (backup, cache, database tools) are real gaps.
 */
import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync, readdirSync, statSync } from "fs";
import { join, relative, resolve } from "path";
import { getEnabledModules, MODULE_NAMES, type ModuleName } from "../../config/features";
import {
  AUDIENCES,
  AUDIENCE_META,
  getDocEntry,
  HONEST_MISSING_SUMMARY,
  listAdrEntries,
  listDocsForAudience,
  type DocAudience,
} from "../../src/lib/docs/registry";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { DocMarkdown } from "../../src/lib/docs/markdown";

/** Test-side HTML rendering: react-dom/server is fine here (never bundled into the app). */
function renderMarkdownToHtml(markdown: string): string {
  return renderToStaticMarkup(createElement(DocMarkdown, { markdown }));
}

const ROOT = resolve(import.meta.dir, "..", "..");
const DOCS = join(ROOT, "docs");

function allMarkdownFiles(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) allMarkdownFiles(full, out);
    else if (name.endsWith(".md")) out.push(full);
  }
  return out;
}

function firstHeading(path: string): string | null {
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const m = /^#\s+(.*)$/.exec(line.trim());
    if (m) return m[1].trim();
  }
  return null;
}

describe("registry covers the three audiences (UI-40)", () => {
  test("exposes exactly users, developers, operators", () => {
    expect([...AUDIENCES].sort()).toEqual(["developers", "operators", "users"]);
  });

  test("every audience has metadata and at least one entry", () => {
    for (const audience of AUDIENCES) {
      expect(AUDIENCE_META[audience].label.length).toBeGreaterThan(0);
      expect(AUDIENCE_META[audience].description.length).toBeGreaterThan(0);
      expect(listDocsForAudience(audience).length).toBeGreaterThan(0);
    }
  });

  test("slugs are unique within an audience", () => {
    for (const audience of AUDIENCES) {
      const slugs = listDocsForAudience(audience).map((e) => e.slug);
      expect(new Set(slugs).size).toBe(slugs.length);
    }
  });
});

describe("every available entry resolves to a real file on disk (UI-40)", () => {
  test("available entries point at existing files inside docs/", () => {
    for (const audience of AUDIENCES) {
      for (const entry of listDocsForAudience(audience)) {
        if (entry.status !== "available") continue;
        expect(entry.filePath, `${audience}/${entry.slug} has no filePath`).not.toBeNull();
        expect(
          existsSync(entry.filePath as string),
          `${audience}/${entry.slug} -> ${entry.filePath} does not exist`,
        ).toBe(true);
        const rel = relative(DOCS, resolve(entry.filePath as string));
        expect(rel.startsWith(".."), `${audience}/${entry.slug} escapes docs/`).toBe(false);
      }
    }
  });

  test("missing entries never claim a file that exists", () => {
    for (const audience of AUDIENCES) {
      for (const entry of listDocsForAudience(audience)) {
        if (entry.status !== "missing") continue;
        if (entry.filePath !== null) expect(existsSync(entry.filePath)).toBe(false);
        // Honesty: the summary is the fixed honest notice, not invented prose.
        expect(entry.summary).toBe(HONEST_MISSING_SUMMARY);
      }
    }
  });

  test("every available entry carries a title derived from the file itself", () => {
    for (const audience of AUDIENCES) {
      for (const entry of listDocsForAudience(audience)) {
        if (entry.status !== "available") continue;
        expect(entry.title.length).toBeGreaterThan(0);
        const heading = firstHeading(entry.filePath as string);
        if (heading) expect(entry.title).toBe(heading);
      }
    }
  });
});

describe("user guides: promoted modules only, honest missing state (UI-40)", () => {
  const users = listDocsForAudience("users");
  const enabled = getEnabledModules();

  test("one entry per promoted module, no invented module slugs", () => {
    expect(users.map((e) => e.slug).sort()).toEqual([...enabled].sort());
    for (const entry of users) {
      expect((MODULE_NAMES as readonly string[]).includes(entry.slug)).toBe(true);
    }
  });

  test("status matches docs/modules/ on disk exactly", () => {
    for (const entry of users) {
      const file = join(DOCS, "modules", `${entry.slug}.md`);
      if (existsSync(file)) {
        expect(entry.status, `${entry.slug} guide exists on disk`).toBe("available");
        expect(entry.filePath).toBe(file);
      } else {
        expect(entry.status, `${entry.slug} guide is absent on disk`).toBe("missing");
        expect(entry.filePath).toBeNull();
      }
    }
  });

  test("current truth: six guides exist, five promoted modules lack a guide", () => {
    const available = users
      .filter((e) => e.status === "available")
      .map((e) => e.slug)
      .sort();
    const missing = users
      .filter((e) => e.status === "missing")
      .map((e) => e.slug)
      .sort();
    expect(available).toEqual([
      "awards",
      "chapters",
      "committees",
      "finance",
      "learning",
      "workspaces",
    ]);
    expect(missing).toEqual(["content", "events", "forums", "jobs", "members"]);
  });

  test("unknown slugs resolve to nothing (no fabricated guide pages)", () => {
    expect(getDocEntry("users", "totally-invented-module")).toBeUndefined();
    expect(getDocEntry("users", "billing")).toBeUndefined();
  });
});

describe("developer section: architecture, specs, API conventions, ADRs (UI-40)", () => {
  const developers = listDocsForAudience("developers");
  const bySlug = new Map(developers.map((e) => [e.slug, e]));

  test("architecture overview and API conventions resolve to their files", () => {
    expect(bySlug.get("architecture-overview")?.filePath).toBe(
      join(DOCS, "architecture", "overview.md"),
    );
    expect(bySlug.get("api-conventions")?.filePath).toBe(join(DOCS, "api", "conventions.md"));
    expect(existsSync(join(DOCS, "api", "conventions.md"))).toBe(true);
  });

  test("technical specs coverage matches docs/technical-specs/ exactly", () => {
    const onDisk = readdirSync(join(DOCS, "technical-specs")).filter((f) =>
      /^\d{2}-.+\.md$/.test(f),
    );
    const specEntries = developers.filter(
      (e) => e.slug.startsWith("spec-") && e.slug !== "spec-index",
    );
    expect(specEntries.length).toBe(onDisk.length);
    for (const file of onDisk) {
      const entry = bySlug.get(`spec-${file.replace(/\.md$/, "")}`);
      expect(entry, `no entry for technical-specs/${file}`).toBeDefined();
      expect(entry?.filePath).toBe(join(DOCS, "technical-specs", file));
      expect(entry?.status).toBe("available");
    }
    expect(bySlug.get("spec-index")?.filePath).toBe(join(DOCS, "technical-specs", "_index.md"));
  });

  test("ADR index matches the docs/adr directory one-for-one", () => {
    const adrFiles = readdirSync(join(DOCS, "adr"))
      .filter((f) => /^\d{4}-.+\.md$/.test(f))
      .sort();
    const index = listAdrEntries();
    expect(index.map((e) => e.fileName).sort()).toEqual(adrFiles);
    // README.md is the directory's index doc, never an ADR entry itself.
    expect(index.some((e) => e.fileName === "README.md")).toBe(false);
  });

  test("ADR numbers and titles are parsed from each file's own heading", () => {
    for (const adr of listAdrEntries()) {
      const content = readFileSync(join(DOCS, "adr", adr.fileName), "utf8");
      const m = /^#\s*ADR-(\d{4}):\s*(.+)$/m.exec(content);
      expect(m, `${adr.fileName} lacks an "# ADR-NNNN: Title" heading`).not.toBeNull();
      if (!m) continue;
      expect(adr.number).toBe(m[1]);
      expect(adr.title).toBe(m[2].trim());
      expect(adr.filePath).toBe(join(DOCS, "adr", adr.fileName));
      expect(existsSync(adr.filePath)).toBe(true);
    }
  });

  test("every ADR has a detail entry in the developer registry", () => {
    for (const adr of listAdrEntries()) {
      const slug = `adr-${adr.fileName.replace(/\.md$/, "")}`;
      const entry = bySlug.get(slug);
      expect(entry, `missing detail entry ${slug}`).toBeDefined();
      expect(entry?.filePath).toBe(adr.filePath);
      expect(entry?.status).toBe("available");
    }
  });
});

describe("operator section: deployment, env config, observability, runbook gaps (UI-40)", () => {
  const operators = listDocsForAudience("operators");
  const bySlug = new Map(operators.map((e) => [e.slug, e]));

  test("deployment plan, environment configuration, observability are available", () => {
    expect(bySlug.get("deployment-plan")?.filePath).toBe(join(DOCS, "DEPLOYMENT_PLAN.md"));
    expect(bySlug.get("environment-configuration")?.filePath).toBe(
      join(DOCS, "technical-specs", "11-environment-configuration.md"),
    );
    expect(bySlug.get("observability")?.filePath).toBe(join(DOCS, "observability.md"));
    for (const slug of ["deployment-plan", "environment-configuration", "observability"]) {
      expect(bySlug.get(slug)?.status).toBe("available");
    }
  });

  test("runbook slots exist for backup, cache, and database tools and mirror disk truth", () => {
    // Disk truth: no runbook file for these tools exists anywhere under docs/.
    const candidates = allMarkdownFiles(DOCS).filter((f) => {
      const name = f.toLowerCase();
      const toolHit = /(backup|cache|database)/.test(name);
      const runbookHit = /runbook|maintenance|operations/.test(name);
      return toolHit && runbookHit;
    });
    expect(candidates, "a runbook appeared on disk; the registry should now find it").toEqual([]);

    for (const tool of ["backup", "cache", "database"]) {
      const entry = bySlug.get(`runbook-${tool}`);
      expect(entry, `missing runbook slot for ${tool}`).toBeDefined();
      expect(entry?.status).toBe("missing");
    }
  });
});

describe("detail rendering returns markdown-derived HTML (UI-40)", () => {
  test("one doc per audience renders to HTML containing its own content", async () => {
    const samples: Array<[DocAudience, string]> = [
      ["users", "awards"],
      ["developers", "architecture-overview"],
      ["operators", "deployment-plan"],
    ];
    for (const [audience, slug] of samples) {
      const entry = getDocEntry(audience, slug);
      expect(entry?.status).toBe("available");
      const md = readFileSync(entry!.filePath as string, "utf8");
      const html = renderMarkdownToHtml(md);
      expect(html).toContain("<h1");
      expect(html).toContain("<p");
      expect(html).toContain(entry!.title);
      // The raw markdown heading marker must not survive rendering.
      expect(html.includes(`# ${entry!.title}`)).toBe(false);
    }
  });

  test("GFM tables render (ADR index source doc)", () => {
    const md = readFileSync(join(DOCS, "adr", "README.md"), "utf8");
    const html = renderMarkdownToHtml(md);
    expect(html).toContain("<table");
    expect(html).toContain("<th");
  });

  test("headings receive anchor ids", () => {
    const html = renderMarkdownToHtml("# Top\n\n## Some section\n\ntext\n");
    expect(html).toMatch(/<h2[^>]*id="some-section"/);
  });

  test("missing-guide detail state is honest, not fabricated content", () => {
    const entry = getDocEntry("users", "members");
    expect(entry?.status).toBe("missing");
    expect(entry?.filePath).toBeNull();
    expect(entry?.summary).toBe(HONEST_MISSING_SUMMARY);
    // The promoted module set explains every missing guide; nothing else.
    const missingSlugs = listDocsForAudience("users")
      .filter((e) => e.status === "missing")
      .map((e) => e.slug as ModuleName);
    for (const slug of missingSlugs) {
      expect(existsSync(join(DOCS, "modules", `${slug}.md`))).toBe(false);
    }
  });
});
