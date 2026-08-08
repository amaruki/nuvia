import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { QueryProvider } from "@/components/providers/query-provider";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <QueryProvider>
          <ThemeProvider
            enableSystem={true}
            defaultTheme="system"
            attribute="data-theme"
            storageKey="theme"
            disableTransitionOnChange
          >
            {children}
            <Toaster position="top-center" closeButton duration={5000} />
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
