/**
 * Supply-chain audit gate (issue #4).
 *
 * Enforces docs/supply-chain.md's triage policy in CI: the build fails when
 * `bun audit --prod` reports a HIGH or CRITICAL advisory that is not covered
 * by an active (non-expired) entry in SECURITY-WAIVERS.md. Dev-only chains,
 * moderate/low findings, and waived advisories never fail the gate.
 *
 * Waiver matching: every `### GHSA-...` section in SECURITY-WAIVERS.md
 * contributes its advisory ids, but a section whose `**Expires**` date has
 * passed no longer counts — an unreviewed waiver must not silently become a
 * permanent exception.
 *
 * Run locally with `bun run audit:gate`.
 */

interface Advisory {
  url: string;
  title: string;
  severity: string;
}

async function loadWaivedIds(): Promise<Set<string>> {
  const file = Bun.file("SECURITY-WAIVERS.md");
  if (!(await file.exists())) {
    console.error("audit-gate: SECURITY-WAIVERS.md not found");
    process.exit(1);
  }
  const waiverText = await file.text();
  const today = new Date().toISOString().slice(0, 10);
  const waived = new Set<string>();
  for (const section of waiverText.split(/^### /m).slice(1)) {
    const ids = [...section.matchAll(/GHSA-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}/g)].map(
      (match) => match[0],
    );
    const expiry = /\*\*Expires\*\*:\s*(\d{4}-\d{2}-\d{2})/.exec(section)?.[1];
    if (expiry && expiry < today) {
      console.warn(`audit-gate: waiver expired, no longer counting: ${ids.join(", ")}`);
      continue;
    }
    for (const id of ids) waived.add(id);
  }
  return waived;
}

const waived = await loadWaivedIds();

const audit = Bun.spawnSync(["bun", "audit", "--prod", "--json"]);
const stdout = new TextDecoder().decode(audit.stdout);
const jsonLine = stdout
  .split("\n")
  .filter((line) => line.trim().startsWith("{"))
  .pop();

if (!jsonLine) {
  console.error(`audit-gate: could not parse bun audit output:\n${stdout}`);
  process.exit(1);
}

const report = JSON.parse(jsonLine) as Record<string, Advisory[]>;
const blocking: string[] = [];
let total = 0;

for (const [pkg, advisories] of Object.entries(report)) {
  for (const advisory of advisories) {
    total += 1;
    if (advisory.severity !== "high" && advisory.severity !== "critical") continue;
    const ghsa = /GHSA-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}/.exec(advisory.url)?.[0] ?? "";
    if (waived.has(ghsa)) {
      console.log(`audit-gate: waived ${ghsa} (${pkg}: ${advisory.title})`);
      continue;
    }
    blocking.push(`${ghsa} ${advisory.severity} in ${pkg}: ${advisory.title}`);
  }
}

if (blocking.length > 0) {
  console.error(`audit-gate: ${blocking.length} unwaived high/critical production advisory(s):`);
  for (const line of blocking) console.error(`  - ${line}`);
  console.error(
    "Fix the dependency (overrides/upgrade) or add a dated reachability waiver to SECURITY-WAIVERS.md.",
  );
  process.exit(1);
}

console.log(
  `audit-gate: OK — ${total} prod advisory(s) found, none unwaived high/critical (${waived.size} active waiver id(s) loaded)`,
);

// Top-level await requires module context.
export {};
