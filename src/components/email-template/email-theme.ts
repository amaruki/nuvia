import type { Config } from "tailwindcss";

/**
 * Email-scoped design tokens: a literal copy of the app palette
 * (src/app/globals.css :root) for transactional emails.
 *
 * Email clients never load globals.css and ignore CSS custom properties, so
 * the shared `config` passed to every template's <Tailwind> wrapper must
 * resolve the same semantic names to literal hex values. Keep in sync with
 * globals.css when the brand tokens change.
 *
 * Note: no opacity modifiers (/15 etc.) here — Tailwind emits those as
 * color-mix(), which most email clients do not support. Email surfaces use
 * solid token colors with explicit contrast pairs instead (e.g. `text-white`
 * on the dark success/info band colors).
 */
export const EMAIL_TAILWIND_CONFIG = {
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: "#58d3db", foreground: "#000000" },
        foreground: "#000000",
        card: { DEFAULT: "#f7f8f8" },
        muted: { DEFAULT: "#f1f5f9", foreground: "#323232" },
        success: "#06691b",
        warning: "#894b00",
        info: "#275d9e",
        destructive: "#c10007",
        border: "#e1eaef",
      },
    },
  },
} satisfies Config;
