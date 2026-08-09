import Link from "next/link";
import Image from "next/image";
import { DarkModeToggle } from "@/components/ui/dark-mode-toggle";
import { MobileNav } from "@/components/landing/mobile-nav";
import { Button } from "@/components/ui/button";
import { NAV_LINKS, NAV_LINK_CLASS } from "./landing-data";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/logo.png" alt="Nuvia logo" width={32} height={32} className="rounded-md" />
          <span className="text-lg font-semibold tracking-tight">Nuvia</span>
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className={NAV_LINK_CLASS}>
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1 sm:gap-2">
          <MobileNav />
          <DarkModeToggle />
          <Button variant="ghost" asChild className="hidden sm:inline-flex">
            <Link href="/auth/login">Sign in</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/auth/signup">Get started</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
