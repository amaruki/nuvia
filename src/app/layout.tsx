import type { Metadata } from "next";
import { Instrument_Sans, Libre_Baskerville, IBM_Plex_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { QueryProvider } from "@/components/providers/query-provider";
import { Toaster } from "@/components/ui/sonner";
import { THEME_IDS } from "@/config/themes";
import "./globals.css";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

const fontSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

const fontSerif = Libre_Baskerville({
  subsets: ["latin"],
  variable: "--font-serif",
});

const fontMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: {
    default: "Nuvia: open-source association management",
    template: "%s | Nuvia",
  },
  description:
    "Nuvia is an open-source Association Management System. Manage members, events, content, forums, and jobs on a self-hosted stack of Next.js, PostgreSQL, Drizzle, and Bun.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${fontSans.variable} ${fontSerif.variable} ${fontMono.variable} antialiased`}
      >
        {/*
          WCAG 2.4.1 skip-to-content link (UI-11). First node in <body> so it
          is the first tab stop; visually hidden until focused. Targets
          id="main-content", carried by the <main> of every route group that
          renders one (dashboard shell, landing page, event list layout).
        */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-primary-foreground focus:shadow-md"
        >
          Skip to main content
        </a>
        <QueryProvider>
          <ThemeProvider
            enableSystem={true}
            defaultTheme="system"
            attribute="data-theme"
            storageKey="theme"
            disableTransitionOnChange
            themes={THEME_IDS}
          >
            {children}
            <Toaster position="top-center" closeButton duration={5000} />
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
