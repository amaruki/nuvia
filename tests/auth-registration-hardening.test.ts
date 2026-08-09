/**
 * UI-07 auth & registration hardening guards
 * (docs/planning/03-frontend-improvement-plan.md, section UI-07).
 *
 * The repo has no DOM renderer (no jsdom/happy-dom), so these tests pin the
 * hardening at the two levels that are checkable without one:
 *
 * - Behaviour: the registration form's zod schema carries the terms checkbox
 *   in the form state and rejects unchecked submissions.
 * - Wiring: source-level assertions that the session gate, the live-region
 *   FormMessage, the sonner toasts, the honest callback spinner, and the
 *   shadcn Checkbox are actually in place — mirroring the jobs apply-form
 *   session pattern (src/app/(public)/jobs/[id]/_components/apply-form.tsx).
 */
import { describe, expect, test } from "bun:test";
import { readFileSync } from "fs";
import { join } from "path";
import { registrationFormSchema } from "@/components/events/event-registration-form";

const ROOT = join(import.meta.dir, "..");
const readSource = (...parts: string[]) => readFileSync(join(ROOT, ...parts), "utf8");

const REGISTER_PAGE = readSource(
  "src",
  "app",
  "(public)",
  "events",
  "[id]",
  "register",
  "page.tsx",
);
const APPLY_FORM = readSource(
  "src",
  "app",
  "(public)",
  "jobs",
  "[id]",
  "_components",
  "apply-form.tsx",
);
const FORM_MESSAGE = readSource("src", "components", "auth", "form-message.tsx");
const LOGIN_PAGE = readSource("src", "app", "auth", "login", "page.tsx");
const SIGNUP_PAGE = readSource("src", "app", "auth", "signup", "page.tsx");
const FORGOT_PAGE = readSource("src", "app", "auth", "forgot-password", "page.tsx");
const RESET_PAGE = readSource("src", "app", "auth", "reset-password", "page.tsx");
const CALLBACK_PAGE = readSource("src", "app", "auth", "callback", "page.tsx");
const REGISTRATION_FORM = readSource("src", "components", "events", "event-registration-form.tsx");

describe("event registration requires a session (UI-07)", () => {
  test("register page checks the better-auth session exactly like the jobs apply form", () => {
    // apply-form's gate: useSession() from the better-auth client.
    expect(APPLY_FORM).toContain("useSession");
    expect(REGISTER_PAGE).toContain('import { useSession } from "@/lib/client"');
  });

  test("signed-out visitors are routed to /auth/login with the register path as redirectTo", () => {
    // Same link shape as apply-form: encodeURIComponent of the page the user
    // comes back to after login.
    expect(REGISTER_PAGE).toContain(
      "redirectTo=${encodeURIComponent(`/events/${eventId}/register`)}",
    );
  });

  test("login round-trips the redirectTo param", () => {
    expect(LOGIN_PAGE).toContain('searchParams.get("redirectTo")');
  });

  test("registration feedback uses sonner toasts, never native dialogs", () => {
    expect(REGISTER_PAGE).toContain('from "sonner"');
    expect(REGISTER_PAGE).toContain("toast.success");
    expect(REGISTER_PAGE).toContain("toast.error");
    expect(REGISTER_PAGE).not.toMatch(/\balert\(/);
    expect(REGISTER_PAGE).not.toMatch(/\bconfirm\(/);
  });
});

describe("FormMessage has live-region semantics and safe contrast (UI-07)", () => {
  test("errors announce assertively via role=alert", () => {
    expect(FORM_MESSAGE).toMatch(/role=\{isError \? "alert" : "status"\}/);
    expect(FORM_MESSAGE).toMatch(/aria-live=\{isError \? "assertive" : "polite"\}/);
  });

  test("successes announce politely via role=status", () => {
    // Non-error branch of the same ternaries lands on
    // role="status" + aria-live="polite".
    expect(FORM_MESSAGE).toMatch(/role=\{isError \? "alert" : "status"\}/);
    expect(FORM_MESSAGE).toMatch(/aria-live=\{isError \? "assertive" : "polite"\}/);
  });

  test("success text no longer uses the low-contrast text-primary", () => {
    // --primary is a light tint (oklch lightness ~0.8) and fails 4.5:1 on the
    // light card/background the auth pages sit on.
    expect(FORM_MESSAGE).not.toContain("text-primary");
  });

  test("errors keep the destructive tint", () => {
    expect(FORM_MESSAGE).toContain("text-destructive");
  });
});

describe("FormMessage is the single banner on the auth pages (UI-07)", () => {
  test("forgot-password renders through the shared FormMessage", () => {
    expect(FORGOT_PAGE).toContain('from "@/components/auth/form-message"');
    expect(FORGOT_PAGE).toContain("<FormMessage");
  });

  test("reset-password renders through the shared FormMessage", () => {
    expect(RESET_PAGE).toContain('from "@/components/auth/form-message"');
    expect(RESET_PAGE).toContain("<FormMessage");
  });

  test("no hand-rolled banner markup survives on forgot/reset", () => {
    for (const source of [FORGOT_PAGE, RESET_PAGE]) {
      expect(source).not.toContain("bg-destructive/10 border-destructive/30");
      expect(source).not.toContain("bg-primary/10 border-primary/30");
    }
  });

  test("login/signup keep the sonner channel (deliberate toast migration 804d484)", () => {
    for (const source of [LOGIN_PAGE, SIGNUP_PAGE]) {
      expect(source).toContain('from "sonner"');
      expect(source).not.toContain("bg-destructive/10 border-destructive/30");
    }
  });
});

describe("OAuth callback is honest while loading (UI-07)", () => {
  test("the fake 60% progress bar is gone", () => {
    expect(CALLBACK_PAGE).not.toMatch(/width:\s*"60%"/);
  });

  test("an indeterminate LoadingSpinner shows instead, with busy semantics", () => {
    expect(CALLBACK_PAGE).toContain('from "@/components/ui/loading-spinner"');
    expect(CALLBACK_PAGE).toContain("aria-busy");
  });

  test("copy says what is actually happening", () => {
    expect(CALLBACK_PAGE).toContain("Signing you in");
  });
});

describe("event registration terms checkbox lives in the form state (UI-07)", () => {
  test("the form uses the shadcn Checkbox, not a native input", () => {
    expect(REGISTRATION_FORM).toContain('from "@/components/ui/checkbox"');
    expect(REGISTRATION_FORM).toContain("<Checkbox");
    expect(REGISTRATION_FORM).not.toContain('type="checkbox"');
  });

  test("no hand-coded inline style colors survive", () => {
    expect(REGISTRATION_FORM).not.toMatch(/style=\{\{[^}]*var\(--/);
  });

  test("the terms error renders through the form's error mechanism", () => {
    // Form-standard (UI-16): the terms field is a FormField whose error
    // surfaces via FormMessage, not a hand-written errors.terms paragraph.
    expect(REGISTRATION_FORM).toContain('name="terms"');
    expect(REGISTRATION_FORM).toContain("<FormMessage />");
    expect(REGISTRATION_FORM).not.toMatch(/text-destructive">\{errors\./);
  });

  test("the form schema rejects an unchecked terms box", () => {
    const rejected = registrationFormSchema.safeParse({
      eventId: crypto.randomUUID(),
      notes: "",
      terms: false,
    });
    expect(rejected.success).toBe(false);
    if (!rejected.success) {
      expect(rejected.error.issues.some((issue) => issue.path.includes("terms"))).toBe(true);
    }
  });

  test("the form schema accepts a checked terms box and keeps the base rules", () => {
    const accepted = registrationFormSchema.safeParse({
      eventId: crypto.randomUUID(),
      notes: "",
      terms: true,
    });
    expect(accepted.success).toBe(true);

    // Base registration rules still apply through the extension.
    const longNotes = registrationFormSchema.safeParse({
      eventId: crypto.randomUUID(),
      notes: "x".repeat(501),
      terms: true,
    });
    expect(longNotes.success).toBe(false);
  });
});
