/**
 * Copy-style guard (Phase 8, plan item 6): no em dashes and no emoji glyphs
 * in user-facing UI copy under src/.
 *
 * Scans src/** for these glyphs in USER-FACING text (string literals,
 * template literals, and JSX text content):
 *   - U+2014            em dash
 *   - U+1F300-U+1FAFF   emoji (pictographs, symbols, transport, flag area)
 *   - U+2600-U+27BF     misc symbols + dingbats
 *   - U+FE0F            variation selector-16 (emoji presentation)
 *   - U+2190-U+21FF     arrows
 *
 * `//` line comments and block comments (including JSX `{/* ... *\/}`) are
 * stripped before scanning, so comments may freely contain em dashes and
 * arrows. A `//` inside a string (e.g. a URL) is not treated as a comment.
 * Known limitation: a regex literal whose body contains an unescaped slash-
 * star could be misread as a comment start; no such regex exists in src/.
 *
 * EXCEPTION: docs/planning/** is deliberately NOT scanned. Those files sit
 * on the edit-denylist (this guard may not rewrite them to pass) and their
 * planning prose legitimately contains em dashes. The guard only polices
 * src/ copy.
 *
 * RATCHET BASELINE: the tree currently carries 146 pre-Phase-8 violations
 * across 87 files (prose em dashes, "—" null placeholders, pagination/sort
 * arrows, emoji log prefixes, and the category-emoji feature defaults).
 * Removing them all is the UI-13 copy sweep and is intentionally NOT done
 * piecemeal here: Phase 8 guardrail work may not edit src/**, and several of
 * the strings are asserted by tests. BASELINE records the known per-file
 * counts so that:
 *   - any NEW violation fails the guard,
 *   - a fixed violation must be removed from BASELINE (stale entries fail),
 * i.e. the list can only shrink. Regenerate with --print-baseline.
 *
 * Self-test: `bun run scripts/check-copy-style.ts --self-test`.
 */

const EM_DASH = 0x2014;
const ARROW_LO = 0x2190;
const ARROW_HI = 0x21ff;
const MISC_LO = 0x2600;
const MISC_HI = 0x27bf;
const EMOJI_LO = 0x1f300;
const EMOJI_HI = 0x1faff;
const VARIATION_SELECTOR = 0xfe0f;

/**
 * Known pre-Phase-8 violations per file (see header). May only shrink; any
 * mismatch with the actual scan fails the guard. Notable entries:
 *   - do-dont-demo.tsx: deliberate emoji anti-example in the design preview.
 *   - add-category-form/visual-settings-section: category emoji feature,
 *     removed by the UI-13 sweep.
 *   - lib/auth/email.ts etc.: emoji log prefixes (not user-visible, but the
 *     guard scans every string literal by design).
 */
export const BASELINE: Record<string, number> = {
  "src/app/(public)/certificates/page.tsx": 1,
  "src/app/(public)/chapters/page.tsx": 2,
  "src/app/(public)/committees/page.tsx": 2,
  "src/app/(public)/docs/not-found.tsx": 1,
  "src/app/(public)/docs/page.tsx": 2,
  "src/app/(public)/error.tsx": 1,
  "src/app/(public)/events/page.tsx": 1,
  "src/app/(public)/forums/[category]/page.tsx": 5,
  "src/app/(public)/forums/_components/comment-form.tsx": 1,
  "src/app/(public)/jobs/page.tsx": 1,
  "src/app/(public)/members/[id]/page.tsx": 1,
  "src/app/(public)/membership/_components/apply-dialog.tsx": 1,
  "src/app/(public)/membership/_components/join-tier-cta.tsx": 1,
  "src/app/(public)/membership/page.tsx": 2,
  "src/app/(public)/news/page.tsx": 5,
  "src/app/api/v1/admin/users/[id]/role/route.ts": 1,
  "src/app/auth/error.tsx": 1,
  "src/app/dashboard/analytics/events/page.tsx": 2,
  "src/app/dashboard/analytics/financial/page.tsx": 1,
  "src/app/dashboard/analytics/members/page.tsx": 3,
  "src/app/dashboard/analytics/page.tsx": 1,
  "src/app/dashboard/announcements/page.tsx": 4,
  "src/app/dashboard/awards/nominate/_components/nomination-form.tsx": 1,
  "src/app/dashboard/awards/nominations/page.tsx": 1,
  "src/app/dashboard/awards/programs/_components/program-utils.ts": 1,
  "src/app/dashboard/awards/programs/_components/program-table.tsx": 1,
  "src/app/dashboard/content/articles/[id]/_components/article-helpers.ts": 1,
  "src/app/dashboard/events/checkin/page.tsx": 2,
  "src/app/dashboard/events/create/_components/basic-info-section.tsx": 1,
  "src/app/dashboard/events/pricing/page.tsx": 2,
  "src/app/dashboard/events/registrations/page.tsx": 2,
  "src/app/dashboard/finance/budget/page.tsx": 1,
  "src/app/dashboard/finance/donations/page.tsx": 2,
  "src/app/dashboard/finance/gateways/page.tsx": 2,
  "src/app/dashboard/finance/reports/[id]/_components/outstanding-receivables-section.tsx": 3,
  "src/app/dashboard/finance/reports/[id]/_components/page-states.tsx": 1,
  "src/app/dashboard/learning/courses/[courseId]/_components/course-sidebar-card.tsx": 1,
  "src/app/dashboard/memberships/analytics/page.tsx": 1,
  "src/app/dashboard/memberships/applications/_components/review-dialog.tsx": 1,
  "src/app/dashboard/memberships/applications/page.tsx": 2,
  "src/app/dashboard/memberships/renewals/_components/helpers.ts": 1,
  "src/app/dashboard/memberships/renewals/page.tsx": 1,
  "src/app/dashboard/memberships/tiers/_components/tier-edit-dialog.tsx": 1,
  "src/app/dashboard/my/finance/_components/format.ts": 1,
  "src/app/dashboard/profile/components/public-profile-visibility.tsx": 1,
  "src/app/dashboard/settings/email/page.tsx": 1,
  "src/app/dashboard/settings/general/organization-settings-form/organization-settings-form.tsx": 1,
  "src/app/dashboard/settings/oauth/page.tsx": 1,
  "src/app/dashboard/settings/payments/_components/format.ts": 1,
  "src/app/dashboard/settings/payments/page.tsx": 2,
  "src/app/dashboard/settings/security/_components/delete-account-dialog.tsx": 1,
  "src/app/dashboard/settings/security/page.tsx": 1,
  "src/app/dashboard/tools/backup/_components/backup-status-panel.tsx": 3,
  "src/app/dashboard/tools/backup/_components/demo-sandbox-notice.tsx": 1,
  "src/app/dashboard/tools/backup/page.tsx": 1,
  "src/app/dashboard/tools/cache/_components/cache-status-panel.tsx": 2,
  "src/app/dashboard/tools/cache/page.tsx": 1,
  "src/app/dashboard/tools/database/_components/database-health-panel.tsx": 4,
  "src/app/dashboard/tools/logs/_components/logs-status-panel.tsx": 6,
  "src/app/dashboard/users/security/page.tsx": 1,
  "src/app/design/preview/_components/do-dont-demo.tsx": 2,
  "src/app/global-error.tsx": 1,
  "src/components/content/add-category-form/index.tsx": 1,
  "src/components/content/add-category-form/visual-settings-section.tsx": 1,
  "src/components/content/content-data-table/cells.tsx": 2,
  "src/components/content/content-data-table/media-columns.tsx": 1,
  "src/components/dashboard/module-preview-banner.tsx": 2,
  "src/components/dashboard/widgets/finance-widget.tsx": 2,
  "src/components/finance/invoices-table/index.tsx": 1,
  "src/components/memberships/membership-list/helpers.ts": 2,
  "src/lib/auth/email.ts": 10,
  "src/lib/docs/registry.ts": 1,
  "src/lib/env.ts": 1,
  "src/lib/hooks/use-finance-dues/hydrate-due.ts": 1,
  "src/lib/hooks/use-finance-dues/index.ts": 2,
  "src/lib/hooks/use-finance-invoices/index.ts": 3,
  "src/lib/hooks/use-finance-reports.ts": 3,
  "src/lib/hooks/use-learning-enrollments.ts": 1,
  "src/lib/rate-limit.ts": 1,
  "src/lib/services/event/registrations.ts": 1,
  "src/lib/services/invoice.service.ts": 1,
  "src/lib/services/payment/mutations.ts": 1,
  "src/lib/services/registration/mutations-create.ts": 1,
  "src/lib/services/system-backup.service.ts": 3,
  "src/lib/services/system-cache.service.ts": 1,
  "src/lib/session-cache/cache-ops.ts": 1,
  "src/types/jobs.types.ts": 1,
};

interface Violation {
  line: number;
  glyph: string;
  snippet: string;
}

/** Name a banned codepoint, or return null when the glyph is allowed. */
function bannedName(cp: number): string | null {
  if (cp === EM_DASH) return "em dash (U+2014)";
  if (cp >= ARROW_LO && cp <= ARROW_HI) return `arrow (U+${cp.toString(16).toUpperCase()})`;
  if (cp >= MISC_LO && cp <= MISC_HI) return `symbol/dingbat (U+${cp.toString(16).toUpperCase()})`;
  if (cp === VARIATION_SELECTOR) return "emoji variation selector (U+FE0F)";
  if (cp >= EMOJI_LO && cp <= EMOJI_HI) return `emoji (U+${cp.toString(16).toUpperCase()})`;
  return null;
}

/**
 * Scan one source file. Walks a small state machine so that only
 * strings/templates/JSX text are checked and comments are skipped entirely.
 * Raw code state is also checked: a banned glyph cannot appear in valid TS
 * code outside strings/comments except in JSX text, which is exactly the
 * user-facing surface this guard polices.
 */
export function scanSource(source: string): Violation[] {
  const cps = [...source];
  const lines = source.split("\n");
  const violations: Violation[] = [];
  // Frame stack: "code" (top level or a ${...} expression) or "template".
  const stack: Array<{ kind: "code"; depth: number } | { kind: "template" }> = [
    { kind: "code", depth: 0 },
  ];

  let line = 1;
  const record = (cp: number, atLine: number) => {
    const name = bannedName(cp);
    if (!name) return;
    const raw = lines[atLine - 1] ?? "";
    const snippet = raw.trim();
    violations.push({
      line: atLine,
      glyph: name,
      snippet: snippet.length > 100 ? `${snippet.slice(0, 97)}...` : snippet,
    });
  };

  for (let i = 0; i < cps.length; i++) {
    const c = cps[i];
    const next = i + 1 < cps.length ? cps[i + 1] : "";
    const top = stack[stack.length - 1];

    if (top.kind === "template") {
      if (c === "\\") {
        if (next === "\n") line++;
        i++; // skip the escaped character
      } else if (c === "$" && next === "{") {
        stack.push({ kind: "code", depth: 1 });
        i++;
      } else if (c === "`") {
        stack.pop();
      } else if (c === "\n") {
        line++;
      } else {
        record(c.codePointAt(0) ?? 0, line);
      }
      continue;
    }

    // Code frame (top level or inside a template ${...} expression).
    if (c === "\n") {
      line++;
    } else if (c === "/" && next === "/") {
      while (i < cps.length && cps[i] !== "\n") i++;
      i--; // let the loop's newline bump line
    } else if (c === "/" && next === "*") {
      i += 2;
      while (i < cps.length && !(cps[i] === "*" && cps[i + 1] === "/")) {
        if (cps[i] === "\n") line++;
        i++;
      }
      i++; // skip the closing "/"
    } else if (c === "'" || c === '"') {
      const quote = c;
      i++;
      while (i < cps.length && cps[i] !== quote) {
        if (cps[i] === "\\") {
          if (cps[i + 1] === "\n") line++;
          i += 2;
          continue;
        }
        if (cps[i] === "\n") line++; // only realistic in a broken file
        record(cps[i].codePointAt(0) ?? 0, line);
        i++;
      }
    } else if (c === "`") {
      stack.push({ kind: "template" });
    } else if (top.depth > 0 && c === "{") {
      top.depth++;
    } else if (top.depth > 0 && c === "}") {
      top.depth--;
      if (top.depth === 0) stack.pop(); // back into the surrounding template
    } else {
      record(c.codePointAt(0) ?? 0, line);
    }
  }
  return violations;
}

interface Ratchet {
  errors: string[];
  newViolations: number;
  baselined: number;
}

/** Compare per-file violation counts against the baseline ratchet. */
export function evaluateCounts(
  counts: Map<string, number>,
  baseline: Record<string, number>,
): Ratchet {
  const errors: string[] = [];
  let newViolations = 0;
  let baselined = 0;

  for (const [file, count] of counts) {
    const allowed = baseline[file];
    if (allowed === undefined) {
      errors.push(`${file}: ${count} new violation(s) — not in the copy-style baseline`);
      newViolations += count;
    } else if (count > allowed) {
      errors.push(`${file}: ${count} violation(s), baseline allows ${allowed}`);
      newViolations += count - allowed;
      baselined += allowed;
    } else if (count < allowed) {
      errors.push(
        `${file}: baseline is stale (allows ${allowed}, found ${count}); shrink BASELINE in scripts/check-copy-style.ts`,
      );
      baselined += count;
    } else {
      baselined += count;
    }
  }
  for (const file of Object.keys(baseline)) {
    if (!counts.has(file)) {
      errors.push(
        `${file}: baseline allows ${baseline[file]} but the file has no violations; remove the BASELINE entry`,
      );
    }
  }
  return { errors, newViolations, baselined };
}

function listSourceFiles(): string[] {
  const glob = new Bun.Glob("src/**/*.{ts,tsx}");
  return [...glob.scanSync(".")].sort();
}

async function scanTree(): Promise<Map<string, Violation[]>> {
  const byFile = new Map<string, Violation[]>();
  for (const file of listSourceFiles()) {
    const source = await Bun.file(file).text();
    const violations = scanSource(source);
    if (violations.length > 0) byFile.set(file, violations);
  }
  return byFile;
}

function selfTest(): void {
  const cases: Array<{ name: string; src: string; expected: number }> = [
    {
      name: "em dash in block comment is allowed",
      src: "/* dash — here */\nconst a = 1;",
      expected: 0,
    },
    {
      name: "em dash in line comment is allowed",
      src: "// prose — with dash\nconst a = 1;",
      expected: 0,
    },
    {
      name: "arrow in JSX comment is allowed",
      src: "const x = <div>{/* ← note */}</div>;",
      expected: 0,
    },
    {
      name: "em dash in double-quoted string is flagged",
      src: 'const label = "retry — later";',
      expected: 1,
    },
    {
      name: "arrow in single-quoted string is flagged",
      src: "const label = 'Next →';",
      expected: 1,
    },
    {
      name: "emoji in JSX text is flagged",
      src: "const x = <Button>🚀 Publish</Button>;",
      expected: 1,
    },
    { name: "em dash in JSX text is flagged", src: "const x = <p>wait — retry</p>;", expected: 1 },
    { name: "emoji in template literal is flagged", src: "const s = `hi 📁 there`;", expected: 1 },
    {
      name: "template ${} nesting stays inside the literal",
      src: "const s = `count ${items.length} — done`;",
      expected: 1,
    },
    {
      name: "url in string does not start a comment",
      src: 'const u = "https://x.dev — path";',
      expected: 1,
    },
    {
      name: "comment marker inside string stays a string",
      src: 'const u = "a // b"; const v = 1;',
      expected: 0,
    },
    {
      name: "escaped quote does not end the string early",
      src: 'const s = "a\\" — b";',
      expected: 1,
    },
    {
      name: "clean file passes",
      src: 'const s = "plain copy";\n// dash — allowed here\n',
      expected: 0,
    },
    { name: "unicode escape is not a literal glyph", src: 'const s = "\\u2014";', expected: 0 },
  ];

  let failed = 0;
  for (const { name, src, expected } of cases) {
    const got = scanSource(src).length;
    if (got !== expected) {
      failed++;
      console.error(`FAIL: ${name} (expected ${expected} violation(s), got ${got})`);
    }
  }

  // Ratchet behavior (one focused baseline per case).
  const base = { "a.ts": 2 };
  const exact = evaluateCounts(new Map([["a.ts", 2]]), base);
  if (exact.errors.length !== 0 || exact.baselined !== 2) {
    failed++;
    console.error("FAIL: ratchet should pass a file exactly at its baseline");
  }
  const fresh = evaluateCounts(
    new Map([
      ["a.ts", 2],
      ["b.ts", 1],
    ]),
    base,
  );
  if (fresh.errors.length !== 1 || !fresh.errors[0].includes("b.ts") || fresh.newViolations !== 1) {
    failed++;
    console.error("FAIL: ratchet should flag violations in a file without baseline");
  }
  const grown = evaluateCounts(new Map([["a.ts", 3]]), base);
  if (grown.errors.length !== 1 || grown.newViolations !== 1) {
    failed++;
    console.error("FAIL: ratchet should flag a file that grew past its baseline");
  }
  const shrunk = evaluateCounts(new Map([["a.ts", 1]]), base);
  if (shrunk.errors.length !== 1 || !shrunk.errors[0].includes("stale")) {
    failed++;
    console.error("FAIL: ratchet should flag a stale baseline entry");
  }
  const gone = evaluateCounts(new Map<string, number>(), base);
  if (gone.errors.length !== 1 || !gone.errors[0].includes("no violations")) {
    failed++;
    console.error("FAIL: ratchet should flag a baseline entry whose file is clean");
  }

  if (failed > 0) {
    console.error(`check-copy-style self-test: ${failed} case(s) failed`);
    process.exit(1);
  }
  console.log(`check-copy-style self-test: all ${cases.length + 5} cases passed`);
}

async function printBaseline(): Promise<void> {
  const byFile = await scanTree();
  const counts = new Map<string, number>();
  for (const [file, violations] of byFile) counts.set(file, violations.length);
  console.log(JSON.stringify(Object.fromEntries(counts), null, 2));
}

async function main(): Promise<void> {
  const byFile = await scanTree();
  const counts = new Map<string, number>();
  for (const [file, violations] of byFile) counts.set(file, violations.length);
  const { errors, newViolations, baselined } = evaluateCounts(counts, BASELINE);

  if (errors.length > 0) {
    // Print violations only for failing files; baselined debt lives in BASELINE
    // and is not repeated on every run.
    for (const [file, violations] of byFile) {
      const allowed = BASELINE[file];
      if (allowed !== undefined && violations.length <= allowed) continue;
      for (const v of violations) {
        console.log(`${file}:${v.line}: ${v.snippet}`);
        console.log(`    ^ ${v.glyph}`);
      }
    }
    for (const error of errors) console.error(`check-copy-style: ${error}`);
    console.error(
      `check-copy-style: FAIL (${newViolations} new violation(s) against the baseline)`,
    );
    process.exit(1);
  }
  console.log(
    `check-copy-style: clean (no new violations; ${baselined} pre-Phase-8 violation(s) baselined across ${counts.size} files; shrink via the UI-13 sweep)`,
  );
}

if (import.meta.main) {
  if (process.argv.includes("--self-test")) {
    selfTest();
  } else if (process.argv.includes("--print-baseline")) {
    await printBaseline();
  } else {
    await main();
  }
}
