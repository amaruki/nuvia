/**
 * UI-23 settings-pages guard.
 *
 * The five settings surfaces were rebuilt from bare h1 stubs into honest
 * pages backed by REAL backend capabilities (see
 * docs/planning/03-frontend-improvement-plan.md). This suite pins the
 * shape of that rebuild at the source level:
 *
 * - Server shells stay hook-free server components (client logic lives in
 *   _components/ islands), matching src/app/dashboard/settings/general.
 * - Every form hits a real endpoint string and resolves through zod
 *   (zodResolver) with shadcn Form primitives — no invented APIs.
 * - No forked surfaces: the pages link the existing active-devices,
 *   login-activities, my/finance, and profile pages instead of rebuilding
 *   their tables.
 */

import { describe, expect, test } from "bun:test";
import { join } from "path";

const ROOT = join(import.meta.dir, "..");

async function readPage(...parts: string[]): Promise<string> {
  return await Bun.file(join(ROOT, ...parts)).text();
}

const SETTINGS_EMAIL_PAGE = await readPage(
  "src",
  "app",
  "dashboard",
  "settings",
  "email",
  "page.tsx",
);
const SETTINGS_OAUTH_PAGE = await readPage(
  "src",
  "app",
  "dashboard",
  "settings",
  "oauth",
  "page.tsx",
);
const SETTINGS_PAYMENTS_PAGE = await readPage(
  "src",
  "app",
  "dashboard",
  "settings",
  "payments",
  "page.tsx",
);
const SETTINGS_SECURITY_PAGE = await readPage(
  "src",
  "app",
  "dashboard",
  "settings",
  "security",
  "page.tsx",
);
const USERS_SECURITY_PAGE = await readPage(
  "src",
  "app",
  "dashboard",
  "users",
  "security",
  "page.tsx",
);

const CHANGE_PASSWORD_FORM = await readPage(
  "src",
  "app",
  "dashboard",
  "settings",
  "security",
  "_components",
  "change-password-form.tsx",
);
const DELETE_ACCOUNT_DIALOG = await readPage(
  "src",
  "app",
  "dashboard",
  "settings",
  "security",
  "_components",
  "delete-account-dialog.tsx",
);
const LINK_GOOGLE_BUTTON = await readPage(
  "src",
  "app",
  "dashboard",
  "settings",
  "oauth",
  "_components",
  "link-google-button.tsx",
);

const SERVER_COMPONENTS = {
  "settings/email page": SETTINGS_EMAIL_PAGE,
  "settings/oauth page": SETTINGS_OAUTH_PAGE,
  "settings/payments page": SETTINGS_PAYMENTS_PAGE,
  "settings/security page": SETTINGS_SECURITY_PAGE,
  "users/security page": USERS_SECURITY_PAGE,
};

describe("UI-23 settings pages are server component shells", () => {
  test.each(Object.entries(SERVER_COMPONENTS))(
    "%s has no client directives, hooks, or handlers",
    (_label, source) => {
      expect(source).not.toContain('"use client"');
      expect(source).not.toContain("'use client'");
      expect(source).not.toMatch(/\b(use[A-Z][a-zA-Z]*|useState|useEffect)\(/);
      expect(source).not.toMatch(/on[A-Z][a-zA-Z]*=/);
    },
  );

  test.each(Object.entries(SERVER_COMPONENTS))(
    "%s opts out of static prerendering",
    (_label, source) => {
      // Every shell reads session/DB state at request time; same pattern as
      // settings/general (keeps `next build` from needing a live database).
      expect(source).toContain('export const dynamic = "force-dynamic"');
      expect(source).not.toContain("TODO");
      expect(source).not.toContain("<h1>");
    },
  );
});

describe("UI-23 settings/security uses the real account-security endpoints", () => {
  test("change-password form posts to the real v1 route with zod resolution", () => {
    expect(CHANGE_PASSWORD_FORM).toContain('"use client"');
    expect(CHANGE_PASSWORD_FORM).toContain('"/api/v1/auth/change-password"');
    expect(CHANGE_PASSWORD_FORM).toContain("zodResolver");
    expect(CHANGE_PASSWORD_FORM).toContain("changePasswordSchema");
    expect(CHANGE_PASSWORD_FORM).toContain("FormField");
    expect(CHANGE_PASSWORD_FORM).toContain("FormMessage");
    expect(CHANGE_PASSWORD_FORM).toContain("sonner");
    // The route revokes other sessions on success — the toast says so.
    expect(CHANGE_PASSWORD_FORM).toContain("signed out of your other devices");
  });

  test("delete-account dialog hits the real v1 route and confirms with a password", () => {
    expect(DELETE_ACCOUNT_DIALOG).toContain('"use client"');
    expect(DELETE_ACCOUNT_DIALOG).toContain('"/api/v1/auth/delete-account"');
    expect(DELETE_ACCOUNT_DIALOG).toContain("zodResolver");
    expect(DELETE_ACCOUNT_DIALOG).toContain("deleteAccountSchema");
    expect(DELETE_ACCOUNT_DIALOG).toContain("AlertDialog");
    expect(DELETE_ACCOUNT_DIALOG).toContain("sonner");
    expect(DELETE_ACCOUNT_DIALOG).toContain('method: "DELETE"');
  });

  test("security shell links the existing self-service surfaces instead of forking them", () => {
    expect(SETTINGS_SECURITY_PAGE).toContain('"/dashboard/active-devices"');
    expect(SETTINGS_SECURITY_PAGE).toContain('"/dashboard/login-activities"');
    expect(SETTINGS_SECURITY_PAGE).toContain("./_components/change-password-form");
    expect(SETTINGS_SECURITY_PAGE).toContain("./_components/delete-account-dialog");
    expect(SETTINGS_SECURITY_PAGE).not.toContain('"use client"');
  });

  test("the delete-account schema lives in the validation library", async () => {
    const validation = await readPage("src", "lib", "validation", "auth.validation.ts");
    expect(validation).toContain("export const deleteAccountSchema");
    expect(validation).toContain("export type DeleteAccountFormData");
  });
});

describe("UI-23 users/security is honest about the admin boundary", () => {
  test("gated through the RBAC helper like settings/general", () => {
    expect(USERS_SECURITY_PAGE).toContain('hasPermission("users:manage")');
  });

  test("states the self-service boundary instead of faking admin controls", () => {
    // The API exposes no cross-user security surface; the page says so.
    expect(USERS_SECURITY_PAGE).toContain("/api/v1/auth/login-activities");
    expect(USERS_SECURITY_PAGE).toContain("/api/v1/auth/active-devices");
    expect(USERS_SECURITY_PAGE).toContain("Multi-factor authentication is not implemented");
  });

  test("links the real admin surfaces instead of rebuilding them", () => {
    expect(USERS_SECURITY_PAGE).toContain('"/dashboard/users/directory"');
    expect(USERS_SECURITY_PAGE).toContain('"/dashboard/users/roles"');
    expect(USERS_SECURITY_PAGE).toContain('"/dashboard/settings/security"');
    expect(USERS_SECURITY_PAGE).not.toContain("useForm");
  });
});

describe("UI-23 settings/email reports deployment truth, not fake toggles", () => {
  test("says preferences are not configurable (no backend store exists)", () => {
    expect(SETTINGS_EMAIL_PAGE).toContain("no email-preferences store");
    expect(SETTINGS_EMAIL_PAGE).not.toContain("useForm");
    expect(SETTINGS_EMAIL_PAGE).not.toContain("Switch");
  });

  test("surfaces the real delivery seams (env + org branding)", () => {
    expect(SETTINGS_EMAIL_PAGE).toContain("RESEND_API_KEY");
    expect(SETTINGS_EMAIL_PAGE).toContain("EMAIL_HOST");
    expect(SETTINGS_EMAIL_PAGE).toContain("EMAIL_FROM");
    expect(SETTINGS_EMAIL_PAGE).toContain("FEATURE_EMAIL_VERIFICATION");
    expect(SETTINGS_EMAIL_PAGE).toContain("getOrganization");
  });
});

describe("UI-23 settings/oauth shows only providers that exist in this build", () => {
  test("reads the user's real linked accounts from the account table", () => {
    expect(SETTINGS_OAUTH_PAGE).toContain('from "@/db/schema"');
    expect(SETTINGS_OAUTH_PAGE).toContain("account.userId");
    expect(SETTINGS_OAUTH_PAGE).toContain("providerId");
  });

  test("marks GitHub/LinkedIn as planned — no connect buttons for unconfigured providers", () => {
    expect(SETTINGS_OAUTH_PAGE).toContain("GOOGLE_CLIENT_ID");
    expect(SETTINGS_OAUTH_PAGE).toContain("Not implemented in this build yet");
    expect(SETTINGS_OAUTH_PAGE).toContain("Planned");
    // Only the configured-provider button island exists.
    expect(SETTINGS_OAUTH_PAGE).toContain("./_components/link-google-button");
  });

  test("the link island drives the real better-auth link-social flow", () => {
    expect(LINK_GOOGLE_BUTTON).toContain('"use client"');
    expect(LINK_GOOGLE_BUTTON).toContain("linkOAuthAccount");
    expect(LINK_GOOGLE_BUTTON).toContain("/api/auth/link-social");
    expect(LINK_GOOGLE_BUTTON).toContain("sonner");
  });
});

describe("UI-23 settings/payments reads the real finance store", () => {
  test("billing summary and history come from the member finance services", () => {
    expect(SETTINGS_PAYMENTS_PAGE).toContain("getMemberFinanceSummary");
    expect(SETTINGS_PAYMENTS_PAGE).toContain("listMemberInvoices");
    expect(SETTINGS_PAYMENTS_PAGE).toContain('"/dashboard/my/finance"');
  });

  test("gateway section mirrors the finance:read-gated gateway endpoint", () => {
    expect(SETTINGS_PAYMENTS_PAGE).toContain("describeConfiguredGateway");
    expect(SETTINGS_PAYMENTS_PAGE).toContain('hasPermission("finance:read")');
  });

  test("states the no-card-storage truth — no fake card management", () => {
    expect(SETTINGS_PAYMENTS_PAGE).toContain("does not store card details");
    expect(SETTINGS_PAYMENTS_PAGE).not.toContain("useForm");
  });
});
