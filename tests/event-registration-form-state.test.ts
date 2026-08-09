import { describe, expect, test } from "bun:test";
import { getRegistrationFormState } from "@/lib/utils/event-utils";

/**
 * Banner/form selection for the public event registration form
 * (src/components/events/event-registration-form.tsx).
 *
 * The three states map to what the card renders:
 * - "open":   no banner, registration form visible.
 * - "full":   "Event Full" banner plus the waitlist form.
 * - "closed": "Registration Closed" banner, form hidden — regardless of
 *             remaining capacity, so closed-and-full events never show the
 *             waitlist form and closed-and-not-full events never render a
 *             blank card.
 */
describe("getRegistrationFormState", () => {
  test("open registration with capacity: form shown, no banner", () => {
    expect(getRegistrationFormState(true, false)).toBe("open");
  });

  test("open registration at capacity: 'full' banner plus waitlist form", () => {
    expect(getRegistrationFormState(true, true)).toBe("full");
  });

  test("closed registration with capacity left: 'closed', form hidden", () => {
    expect(getRegistrationFormState(false, false)).toBe("closed");
  });

  test("closed registration at capacity: still 'closed', no waitlist form", () => {
    expect(getRegistrationFormState(false, true)).toBe("closed");
  });
});
