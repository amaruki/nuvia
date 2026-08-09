import Link from "next/link";
import {
  ArrowUpRight,
  CalendarDays,
  HandCoins,
  Layers,
  LockKeyhole,
  MessagesSquare,
  Newspaper,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PREDEFINED_ROLES, PROMOTION_GATE } from "./landing-data";

export function FeaturesSection() {
  return (
    <section id="features" className="scroll-mt-20 px-4 py-20 sm:px-6 md:py-28 lg:px-8">
      <div className="container mx-auto max-w-6xl">
        <div className="grid gap-6 md:grid-cols-[0.9fr_1.1fr] md:items-end">
          <div>
            <p className="font-mono text-xs font-medium uppercase tracking-widest text-primary">
              One operating system
            </p>
            <h2 className="mt-4 max-w-[20ch] text-4xl font-semibold leading-tight tracking-tighter md:text-5xl">
              Everything an association runs on
            </h2>
          </div>
          <p className="max-w-[60ch] text-base leading-relaxed text-muted-foreground md:justify-self-end">
            One login and one access model for the daily work that is live now, with roadmap modules
            labelled honestly until they clear the promotion gate.
          </p>
        </div>

        <div className="landing-reveal mt-12 grid gap-4 md:grid-cols-6">
          <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-card via-card to-accent/40 md:col-span-4">
            <div
              aria-hidden="true"
              className="absolute -right-10 -top-10 size-40 rounded-full bg-primary/10 blur-3xl"
            />
            <CardHeader className="relative">
              <Badge variant="secondary">Access model</Badge>
              <CardTitle className="mt-3 text-2xl">Roles that map to your organization</CardTitle>
              <CardDescription className="max-w-[58ch] leading-relaxed">
                Built-in and custom roles keep access explicit across the application instead of
                hiding policy in one-off screens.
              </CardDescription>
            </CardHeader>
            <CardContent className="relative grid gap-5">
              <div className="flex flex-wrap gap-2">
                {PREDEFINED_ROLES.map((role) => (
                  <Badge key={role} variant="outline" className="bg-background/70">
                    {role}
                  </Badge>
                ))}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border bg-background/70 p-4">
                  <LockKeyhole className="size-4 text-primary" />
                  <p className="mt-3 text-sm font-medium">Built-in starting points</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {PREDEFINED_ROLES.length} predefined roles cover common association
                    responsibilities.
                  </p>
                </div>
                <div className="rounded-lg border bg-background/70 p-4">
                  <Users className="size-4 text-primary" />
                  <p className="mt-3 text-sm font-medium">Custom roles</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Define additional permission sets without inventing another access system.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-muted/50 md:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <span className="flex size-10 items-center justify-center rounded-lg bg-background text-primary shadow-xs">
                  <Layers className="size-5" />
                </span>
                <Badge variant="outline">How promotion works</Badge>
              </div>
              <CardTitle className="mt-3">The promotion gate</CardTitle>
              <CardDescription className="leading-relaxed">
                A module is promoted only once it has a schema, authorized API, tests, and
                documentation. The landing shows exactly what the registry says.
              </CardDescription>
            </CardHeader>
            <CardContent className="mt-auto grid grid-cols-2 gap-2">
              {PROMOTION_GATE.map((requirement) => (
                <span
                  key={requirement}
                  className="flex items-center gap-2 rounded-md border bg-background/70 px-3 py-2 text-xs"
                >
                  <span className="size-1.5 rounded-full bg-primary/60" />
                  {requirement}
                </span>
              ))}
            </CardContent>
          </Card>

          <Card className="border-border/70 md:col-span-3">
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <CalendarDays className="size-5" />
                </span>
                <Badge>Live</Badge>
              </div>
              <CardTitle className="mt-3">Database-backed events</CardTitle>
              <CardDescription className="leading-relaxed">
                The Events module and its public browsing route run on PostgreSQL through Drizzle.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-border/70 md:col-span-3">
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <MessagesSquare className="size-5" />
                </span>
                <Badge>Live</Badge>
              </div>
              <CardTitle className="mt-3">Content and forums</CardTitle>
              <CardDescription className="leading-relaxed">
                Publish content and give members a place to talk without splitting identity across
                separate tools.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-border/70 bg-muted/50 md:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <span className="flex size-10 items-center justify-center rounded-lg bg-background text-primary shadow-xs">
                  <HandCoins className="size-5" />
                </span>
                <Badge>Live</Badge>
              </div>
              <CardTitle className="mt-3">Dues and finance</CardTitle>
              <CardDescription className="leading-relaxed">
                Promoted through the maturity gate, so dues, invoices, and payments run on the same
                PostgreSQL database as the rest of the product.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-primary bg-primary text-primary-foreground md:col-span-4">
            <CardContent className="flex h-full flex-col justify-between gap-8 lg:flex-row lg:items-center">
              <div className="max-w-xl">
                <span className="flex size-10 items-center justify-center rounded-lg bg-primary-foreground/10">
                  <Newspaper className="size-5" />
                </span>
                <CardTitle className="mt-4 text-xl">Public pages your community can use</CardTitle>
                <CardDescription className="mt-2 text-primary-foreground/75">
                  Events and jobs have public-facing routes, while management stays behind the
                  application&apos;s access gates.
                </CardDescription>
              </div>
              <div className="flex shrink-0 flex-wrap gap-3">
                <Button variant="secondary" asChild className="group">
                  <Link href="/events">
                    Browse events
                    <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transform-none motion-reduce:transition-none" />
                  </Link>
                </Button>
                <Button variant="secondary" asChild className="group">
                  <Link href="/jobs">
                    Job board
                    <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transform-none motion-reduce:transition-none" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
