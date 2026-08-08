import Link from "next/link";
import Image from "next/image";
import { Separator } from "@/components/ui/separator";
import { FOOTER_LINK_CLASS, GITHUB_URL } from "./landing-data";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-muted/30 px-4 py-12 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-6xl">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <Image
                src="/logo.png"
                alt="Nuvia logo"
                width={28}
                height={28}
                className="rounded-md"
              />
              <span className="font-semibold tracking-tight">Nuvia</span>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              Open-source association management with five database-backed modules and an honest
              public roadmap.
            </p>
            <p className="mt-5 flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">
              <span aria-hidden="true" className="size-1.5 rounded-full bg-primary" />
              MIT licensed · Pre-1.0
            </p>
          </div>

          <nav aria-label="Explore">
            <h3 className="text-sm font-semibold">Explore</h3>
            <ul className="mt-3 flex flex-col gap-2.5 text-sm">
              <li>
                <Link href="/events" className={FOOTER_LINK_CLASS}>
                  Events
                </Link>
              </li>
              <li>
                <Link href="/jobs" className={FOOTER_LINK_CLASS}>
                  Job board
                </Link>
              </li>
              <li>
                <Link href="/auth/login" className={FOOTER_LINK_CLASS}>
                  Sign in
                </Link>
              </li>
            </ul>
          </nav>

          <nav aria-label="Project">
            <h3 className="text-sm font-semibold">Project</h3>
            <ul className="mt-3 flex flex-col gap-2.5 text-sm">
              <li>
                <Link
                  href={GITHUB_URL}
                  target="_blank"
                  rel="noreferrer"
                  className={FOOTER_LINK_CLASS}
                >
                  GitHub
                </Link>
              </li>
              <li>
                <Link
                  href={`${GITHUB_URL}/blob/main/README.md`}
                  target="_blank"
                  rel="noreferrer"
                  className={FOOTER_LINK_CLASS}
                >
                  README
                </Link>
              </li>
              <li>
                <Link
                  href={`${GITHUB_URL}/blob/main/LICENSE`}
                  target="_blank"
                  rel="noreferrer"
                  className={FOOTER_LINK_CLASS}
                >
                  License
                </Link>
              </li>
            </ul>
          </nav>

          <nav aria-label="Run it yourself">
            <h3 className="text-sm font-semibold">Run it yourself</h3>
            <ul className="mt-3 flex flex-col gap-2.5 text-sm">
              <li>
                <Link href="/auth/signup" className={FOOTER_LINK_CLASS}>
                  Get started
                </Link>
              </li>
              <li>
                <Link
                  href={GITHUB_URL}
                  target="_blank"
                  rel="noreferrer"
                  className={FOOTER_LINK_CLASS}
                >
                  View source
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        <Separator className="mt-10" />
        <div className="flex flex-col gap-2 pt-6 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} Nuvia. Open source under the MIT License.</p>
          <p className="font-mono text-xs">Next.js 16 · React 19 · PostgreSQL · Drizzle · Bun</p>
        </div>
      </div>
    </footer>
  );
}
