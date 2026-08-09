/**
 * Demo-content assurance for the UI-10 detail and empty-list pages.
 *
 * The new audited pages resolve against the demo seed (scripts/seed-demo.ts):
 *
 *   - event detail  → events.slug "demo-community-meetup" — the id is a
 *     random UUID per seed run, so the path is resolved at run time;
 *   - job detail    → job_postings.slug "demo-program-manager" (stable slug);
 *   - news detail   → content.slug "demo-welcome" (stable slug);
 *   - forum thread  → a synthetic category + published thread owned by this
 *     module: name "DemoSmokeForum" — deliberately free of spaces, because
 *     Next dev delivers %-encoded route params undecoded to the category
 *     lookup, so "Some%20Name" would never match "Some Name";
 *   - empty lists   → pure query shapes (?q=zzz-no-match, ?page=999) that
 *     need no seeded rows at all.
 *
 * Why self-seed: this database is shared with suites that wipe it
 * (tests/demo-mode.test.ts calls seedDemo()/wipeDemo();
 * scripts/run-integration-tests.ts drops the whole volume), so the gate
 * cannot assume the demo rows from a previous run survived. Every run probes
 * the canonical rows, re-runs seed-demo when any are missing, and then
 * (re)creates the forum fixture idempotently.
 */

import postgres from "postgres";

import type { DynamicPageKind } from "./config";
import { TEST_ENV } from "./config";
import { log, run } from "./helpers";

const DEMO_EVENT_SLUG = "demo-community-meetup";
const DEMO_JOB_SLUG = "demo-program-manager";
const DEMO_NEWS_SLUG = "demo-welcome";
const DEMO_MODERATOR_EMAIL = "aria@nuvia.test";

/** Must stay free of spaces/%-encoding — see the module header. */
export const SMOKE_FORUM_CATEGORY = "DemoSmokeForum";
const SMOKE_FORUM_DISPLAY_NAME = "A11y Smoke Forum";
const SMOKE_FORUM_POST_TITLE = "Demo: a11y smoke thread";
const SMOKE_FORUM_POST_CONTENT =
  "Synthetic published thread so the axe smoke can audit a real forum detail page (UI-10).";

function connect() {
  return postgres(TEST_ENV.DATABASE_URL, { max: 1 });
}

/** Re-runs scripts/seed-demo.ts, which owns every demo-* row. */
async function seedDemo(): Promise<void> {
  log(
    "Seeded demo content missing (other suites wipe this database); running scripts/seed-demo.ts…",
  );
  await run(["bun", "run", "scripts/seed-demo.ts"], { DEMO_MODE: "true" });
}

/**
 * Idempotent forum fixture for the thread audit: a space-free category plus
 * one published thread authored by the seeded demo moderator. Both live in
 * the demo namespace (category name starts with "Demo", author is a
 * @nuvia.test persona), so wipeDemo() cleans them up with everything else.
 */
async function ensureForumFixture(sql: postgres.Sql): Promise<void> {
  const [category] = await sql`
    INSERT INTO forum_categories (id, name, display_name, description, is_active, is_private, sort_order)
    VALUES (
      gen_random_uuid()::text,
      ${SMOKE_FORUM_CATEGORY},
      ${SMOKE_FORUM_DISPLAY_NAME},
      'Synthetic category for the a11y smoke forum-thread audit (UI-10); wiped with the demo namespace.',
      true,
      false,
      95
    )
    ON CONFLICT (name) DO UPDATE SET is_active = true, is_private = false
    RETURNING id
  `;

  const [existing] = await sql`
    SELECT id FROM forum_posts
    WHERE category_id = ${category.id} AND title = ${SMOKE_FORUM_POST_TITLE}
  `;
  if (existing) return;

  const [author] = await sql`SELECT id FROM users WHERE email = ${DEMO_MODERATOR_EMAIL}`;
  if (!author) {
    throw new Error(
      `Demo moderator ${DEMO_MODERATOR_EMAIL} is missing even after seeding — cannot create the a11y smoke forum thread.`,
    );
  }

  await sql`
    INSERT INTO forum_posts (id, category_id, user_id, title, content, type, status)
    VALUES (
      gen_random_uuid()::text,
      ${category.id},
      ${author.id},
      ${SMOKE_FORUM_POST_TITLE},
      ${SMOKE_FORUM_POST_CONTENT},
      'DISCUSSION',
      'PUBLISHED'
    )
  `;
  log(`Forum fixture ready: "${SMOKE_FORUM_CATEGORY}" + thread "${SMOKE_FORUM_POST_TITLE}".`);
}

/**
 * Guarantees the demo rows the detail pages audit against exist, seeding
 * them when another suite wiped the shared database.
 */
export async function ensureDemoContent(): Promise<void> {
  const sql = connect();
  try {
    const [marker] = await sql`
      SELECT
        (SELECT count(*)::int FROM events WHERE slug = ${DEMO_EVENT_SLUG}) AS events,
        (SELECT count(*)::int FROM job_postings WHERE slug = ${DEMO_JOB_SLUG}) AS jobs,
        (SELECT count(*)::int FROM content WHERE slug = ${DEMO_NEWS_SLUG}) AS news,
        (SELECT count(*)::int FROM users WHERE email = ${DEMO_MODERATOR_EMAIL}) AS personas
    `;
    if (marker.events === 0 || marker.jobs === 0 || marker.news === 0 || marker.personas === 0) {
      await seedDemo();
    }
    await ensureForumFixture(sql);
    log("Demo content ready for the detail-page audits.");
  } finally {
    await sql.end();
  }
}

/**
 * Resolves the run-time paths of DYNAMIC_PAGES from the seeded rows.
 * Fails loudly when a row is missing — auditing a not-found page would be
 * worse than failing here.
 */
export async function resolveDynamicPaths(): Promise<Record<DynamicPageKind, string>> {
  const sql = connect();
  try {
    const [event] = await sql`
      SELECT id FROM events WHERE slug = ${DEMO_EVENT_SLUG} LIMIT 1
    `;
    if (!event) {
      throw new Error(
        `No seeded event with slug "${DEMO_EVENT_SLUG}" — cannot audit the event detail page.`,
      );
    }

    const [category] = await sql`
      SELECT id FROM forum_categories WHERE name = ${SMOKE_FORUM_CATEGORY} LIMIT 1
    `;
    const [post] = category
      ? await sql`
          SELECT id FROM forum_posts
          WHERE category_id = ${category.id}
            AND title = ${SMOKE_FORUM_POST_TITLE}
            AND status = 'PUBLISHED'
          LIMIT 1
        `
      : [];
    if (!post) {
      throw new Error(
        `Forum fixture ("${SMOKE_FORUM_CATEGORY}" + published thread) not found — cannot audit the forum thread.`,
      );
    }

    return {
      "event-detail": `/events/${event.id}`,
      "forum-thread": `/forums/${SMOKE_FORUM_CATEGORY}/${post.id}`,
    };
  } finally {
    await sql.end();
  }
}
