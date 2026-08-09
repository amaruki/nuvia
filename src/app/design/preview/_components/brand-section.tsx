import Image from "next/image";
import { CalendarDays } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Brand identity for the design preview page: the logo and wordmark lockup,
 * the brand voice quoted verbatim from the landing page, the motion identity
 * from globals.css, and a usage note tying it back to the site header pattern.
 */
export function BrandSection() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Logo and wordmark</CardTitle>
          <CardDescription>
            The lockup exactly as the site header and footer render it.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="Nuvia logo" width={40} height={40} className="rounded-md" />
            <span className="text-xl font-semibold tracking-tight">Nuvia</span>
          </div>
          <ul className="text-muted-foreground list-inside list-disc space-y-1 text-sm">
            <li>The mark ships as /logo.png and always keeps rounded-md corners.</li>
            <li>The wordmark is set semibold with tracking-tight.</li>
            <li>
              The header scales the mark to 32px and the footer to 28px; the lockup order never
              changes.
            </li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Brand voice</CardTitle>
          <CardDescription>Sentences quoted verbatim from the landing page.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <figure className="space-y-1.5">
            <blockquote className="border-primary border-l-2 pl-3 text-sm leading-relaxed">
              Members, events, content, forums, and jobs are live on PostgreSQL today. Nuvia keeps
              the rest of the roadmap visible instead of pretending mock screens are finished.
            </blockquote>
            <figcaption className="text-muted-foreground pl-3 text-xs">Hero section</figcaption>
          </figure>
          <figure className="space-y-1.5">
            <blockquote className="border-primary border-l-2 pl-3 text-sm leading-relaxed">
              Open-source association management with five database-backed modules and an honest
              public roadmap.
            </blockquote>
            <figcaption className="text-muted-foreground pl-3 text-xs">Site footer</figcaption>
          </figure>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">Open source and self-hosted</Badge>
            <span className="text-muted-foreground text-xs">
              Tone: plain claims backed by the database, no hype.
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Motion identity</CardTitle>
          <CardDescription>
            Two easing tokens defined in globals.css drive every entrance and overlay, and two
            landing classes apply them.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="bg-muted/30 rounded-lg border p-3">
              <p className="text-primary font-mono text-xs">--ease-out</p>
              <p className="text-muted-foreground mt-1 font-mono text-xs">
                cubic-bezier(0.23, 1, 0.32, 1)
              </p>
              <p className="text-muted-foreground mt-2 text-sm">
                Entrance and hover easing for page content.
              </p>
            </div>
            <div className="bg-muted/30 rounded-lg border p-3">
              <p className="text-primary font-mono text-xs">--ease-drawer</p>
              <p className="text-muted-foreground mt-1 font-mono text-xs">
                cubic-bezier(0.32, 0.72, 0, 1)
              </p>
              <p className="text-muted-foreground mt-2 text-sm">
                Overlay easing for the sheet drawer and similar chrome.
              </p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="bg-muted/30 rounded-lg border p-3">
              <p className="text-primary font-mono text-xs">.landing-rise</p>
              <p className="text-muted-foreground mt-2 text-sm">
                Fade-up entrance over 0.7s from translateY(16px), staggered with inline
                animation-delay values.
              </p>
            </div>
            <div className="bg-muted/30 rounded-lg border p-3">
              <p className="text-primary font-mono text-xs">.landing-hover</p>
              <p className="text-muted-foreground mt-2 text-sm">
                0.3s transition on transform, box-shadow, and border-color; hover lifts the surface
                2px with shadow-md. Both classes step aside under prefers-reduced-motion.
              </p>
            </div>
          </div>
          <div className="landing-hover border-primary/30 bg-card flex items-center gap-3 rounded-xl border p-4 shadow-sm">
            <span className="bg-primary/10 text-primary flex size-11 shrink-0 items-center justify-center rounded-lg">
              <CalendarDays className="size-5" aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="text-primary block text-xs font-medium">Live tile</span>
              <span className="block text-sm font-semibold">landing-hover in action</span>
              <span className="text-muted-foreground block text-xs">
                Hover this tile to see the lift
              </span>
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Usage note</CardTitle>
          <CardDescription>The site header pattern is already live on this page.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-border/60 bg-background/80 flex h-12 items-center gap-2.5 rounded-lg border px-4 backdrop-blur-xl">
            <Image src="/logo.png" alt="Nuvia logo" width={24} height={24} className="rounded-md" />
            <span className="text-sm font-semibold tracking-tight">Nuvia</span>
            <Badge variant="outline">design preview</Badge>
          </div>
          <p className="text-muted-foreground text-sm leading-relaxed">
            The preview header already uses the site header pattern: sticky, border-border/60,
            bg-background/80, backdrop-blur-xl. Reuse that recipe for any new chrome instead of
            inventing new surface styles, and pair it with the lockup above at 32px or smaller.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
