import type { Metadata } from "next";
import { Instrument_Sans, Libre_Baskerville, IBM_Plex_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { QueryProvider } from "@/components/providers/query-provider";
import { Toaster } from "@/components/ui/sonner";
import { THEME_IDS } from "@/config/themes";
import "./globals.css";

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
