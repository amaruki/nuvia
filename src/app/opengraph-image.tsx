import { ImageResponse } from "next/og";

/**
 * Generated link-preview card for the root route (UI-21).
 *
 * Honest brand card only: the product name and the tagline already used in
 * the root metadata description, on the dark --background token. No
 * screenshots, no fabricated URLs, no deployment-specific assets — the card
 * is pure type plus the primary token accent.
 */

export const alt = "Nuvia: open-source association management";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Hex equivalents of the design tokens in src/app/globals.css
// (--background dark: oklch(0.1822 0 0), --primary light: oklch(0.8012 0.1089 201.1736)).
const BACKGROUND = "#121212";
const FOREGROUND = "#ffffff";
const MUTED = "rgba(255, 255, 255, 0.72)";
const PRIMARY = "#58d3db";

export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        width: "100%",
        height: "100%",
        padding: "0 96px",
        backgroundColor: BACKGROUND,
      }}
    >
      {/* Primary token accent bar */}
      <div
        style={{
          display: "flex",
          width: 96,
          height: 10,
          borderRadius: 5,
          backgroundColor: PRIMARY,
        }}
      />
      <div
        style={{
          display: "flex",
          marginTop: 44,
          fontSize: 96,
          fontWeight: 700,
          letterSpacing: -2,
          color: FOREGROUND,
        }}
      >
        Nuvia
      </div>
      <div
        style={{
          display: "flex",
          marginTop: 28,
          maxWidth: 980,
          fontSize: 34,
          lineHeight: 1.45,
          color: MUTED,
        }}
      >
        The open-source Association Management System. Members, events, content, forums, and jobs on
        a self-hosted stack of Next.js, PostgreSQL, Drizzle, and Bun.
      </div>
    </div>,
    { ...size },
  );
}
