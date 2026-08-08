/**
 * Organization singleton service tests (A2 / ADR-0007).
 *
 * Runs against the shared test database. The singleton row cannot be
 * id-isolated (there is exactly one row), so the suite snapshots whatever
 * it finds in beforeAll and restores it after every test; if no row
 * existed before the suite, the row is reset to defaults instead of
 * deleted so the table ends in the "default row present" state that
 * getOrganization() guarantees anyway.
 */

import { afterAll, afterEach, beforeAll, describe, expect, test } from "bun:test";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { organization, type Organization } from "@/db/schema";
import {
  formatCurrency,
  getOrganization,
  invalidateOrganizationCache,
  ORGANIZATION_DEFAULTS,
  ORGANIZATION_ID,
  updateOrganization,
} from "@/lib/services/organization.service";
import { organizationUpdateSchema } from "@/lib/validation/organization.validation";

let originalRow: Organization | null = null;
const testSuffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

async function readRowDirect(): Promise<Organization | undefined> {
  return db.query.organization.findFirst({ where: eq(organization.id, ORGANIZATION_ID) });
}

beforeAll(async () => {
  originalRow = (await readRowDirect()) ?? null;
});

afterEach(async () => {
  invalidateOrganizationCache();

  if (originalRow) {
    const { id: _id, createdAt, updatedAt, settings, ...editable } = originalRow;
    await db
      .update(organization)
      .set({ ...editable, settings, createdAt, updatedAt })
      .where(eq(organization.id, ORGANIZATION_ID));
  } else {
    // Leave the guaranteed default row in place rather than deleting it —
    // any subsequent getOrganization() would recreate the same row anyway.
    await db
      .update(organization)
      .set({ id: ORGANIZATION_ID, ...ORGANIZATION_DEFAULTS })
      .where(eq(organization.id, ORGANIZATION_ID));
  }
});

afterAll(() => {
  invalidateOrganizationCache();
});

describe("organization service", () => {
  test("getOrganization upserts the default row on first read", async () => {
    await db.delete(organization).where(eq(organization.id, ORGANIZATION_ID));
    invalidateOrganizationCache();
    expect(await readRowDirect()).toBeUndefined();

    const org = await getOrganization();

    expect(org.id).toBe(ORGANIZATION_ID);
    expect(org.name).toBe(ORGANIZATION_DEFAULTS.name);
    expect(org.legalName).toBeNull();
    expect(org.logo).toBeNull();
    expect(org.website).toBeNull();
    expect(org.supportEmail).toBeNull();
    expect(org.locale).toBe("en");
    expect(org.currency).toBe("USD");
    expect(org.timezone).toBe("UTC");
    expect(org.settings).toEqual({});

    // The row now exists in the database for other processes too.
    expect(await readRowDirect()).toBeDefined();
  });

  test("getOrganization caches the row across reads", async () => {
    const first = await getOrganization();
    const second = await getOrganization();
    expect(second).toBe(first);
  });

  test("updateOrganization persists all editable fields", async () => {
    await getOrganization(); // ensure the row exists

    const input = {
      name: `Org Test ${testSuffix}`,
      legalName: `Legal Test ${testSuffix}`,
      logo: "https://example.org/logo.png",
      website: "https://example.org",
      supportEmail: `support-${testSuffix}@example.org`,
      locale: "de-DE",
      currency: "EUR",
      timezone: "Europe/Berlin",
    };

    const updated = await updateOrganization(input, `test-actor-${testSuffix}`);

    expect(updated.name).toBe(input.name);
    expect(updated.legalName).toBe(input.legalName);
    expect(updated.logo).toBe(input.logo);
    expect(updated.website).toBe(input.website);
    expect(updated.supportEmail).toBe(input.supportEmail);
    expect(updated.locale).toBe("de-DE");
    expect(updated.currency).toBe("EUR");
    expect(updated.timezone).toBe("Europe/Berlin");
    expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(updated.createdAt.getTime());

    // Bypass the cache: the row on disk carries the same values.
    invalidateOrganizationCache();
    const reRead = await readRowDirect();
    expect(reRead?.name).toBe(input.name);
    expect(reRead?.supportEmail).toBe(input.supportEmail);
    expect(reRead?.currency).toBe("EUR");
  });

  test("updateOrganization refreshes the cache", async () => {
    await getOrganization();
    const updated = await updateOrganization(
      {
        name: `Cache Test ${testSuffix}`,
        legalName: null,
        logo: null,
        website: null,
        supportEmail: null,
        locale: "en",
        currency: "USD",
        timezone: "UTC",
      },
      `test-actor-${testSuffix}`,
    );

    // No invalidateOrganizationCache() here: the service must have
    // refreshed its cache with the new row.
    const cached = await getOrganization();
    expect(cached.name).toBe(updated.name);
  });
});

describe("organization validation", () => {
  const validInput = {
    name: "Nuvia",
    legalName: "",
    logo: "",
    website: "",
    supportEmail: "",
    locale: "en",
    currency: "usd",
    timezone: "UTC",
  };

  test("normalizes blank optional fields to null and uppercases currency", () => {
    const parsed = organizationUpdateSchema.parse(validInput);
    expect(parsed.legalName).toBeNull();
    expect(parsed.logo).toBeNull();
    expect(parsed.website).toBeNull();
    expect(parsed.supportEmail).toBeNull();
    expect(parsed.currency).toBe("USD");
  });

  test("rejects malformed values", () => {
    expect(organizationUpdateSchema.safeParse({ ...validInput, name: "" }).success).toBe(false);
    expect(organizationUpdateSchema.safeParse({ ...validInput, website: "notaurl" }).success).toBe(
      false,
    );
    expect(
      organizationUpdateSchema.safeParse({ ...validInput, supportEmail: "nope" }).success,
    ).toBe(false);
    expect(organizationUpdateSchema.safeParse({ ...validInput, currency: "ZZZ" }).success).toBe(
      false,
    );
    expect(
      organizationUpdateSchema.safeParse({ ...validInput, timezone: "Mars/Olympus" }).success,
    ).toBe(false);
    expect(
      organizationUpdateSchema.safeParse({ ...validInput, locale: "not a locale!" }).success,
    ).toBe(false);
  });
});

describe("formatCurrency", () => {
  test("formats with the organization currency and locale", () => {
    const eur = formatCurrency(1234.56, { currency: "EUR", locale: "de-DE" });
    expect(eur).toContain("€");
    expect(eur).toContain("1.234,56");

    const usd = formatCurrency(1234.56, { currency: "USD", locale: "en-US" });
    expect(usd).toContain("$");
    expect(usd).toContain("1,234.56");
  });

  test("falls back to en-US USD on an invalid currency/locale pair", () => {
    const fallback = formatCurrency(10, { currency: "NOT_A_CURRENCY", locale: "nope" });
    expect(fallback).toContain("$");
    expect(fallback).toContain("10.00");
  });
});
