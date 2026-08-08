import Link from "next/link";
import Image from "next/image";
import {
  CalendarDays,
  GitFork,
  HandCoins,
  Layers,
  MessagesSquare,
  Newspaper,
  Scale,
  Users,
} from "lucide-react";
import { DarkModeToggle } from "@/components/ui/dark-mode-toggle";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const GITHUB_URL = "https://github.com/amaruki/nuvia";

// Sample rows for the member-directory preview. Rendered by the same
// Table, Avatar, and Badge components the dashboard uses.
const MEMBERS = [
  { initials: "PR", name: "Priya Raman", role: "Committee chair" },
  { initials: "DO", name: "Daniel Okafor", role: "Member" },
  { initials: "SA", name: "Sofia Almeida", role: "Organizer" },
  { initials: "MC", name: "Mei-Lin Chen", role: "Treasurer" },
];

const PREDEFINED_ROLES = [
  "Superadmin",
  "Admin",
  "Treasurer",
  "Committee chair",
  "Organizer",
  "Member",
];

const LIVE_MODULES = ["Members", "Events", "Content", "Forums", "Jobs"];

// Promotion order comes from TODO.md: by value to an association.
const ROADMAP_MODULES = [
  "Finance and dues",
  "Chapters",
  "Committees",
  "Learning",
  "Awards",
  "Workspaces",
];

const QUICK_START = [
  "git clone https://github.com/amaruki/nuvia.git",
  "cd nuvia",
  "bun install",
  "cp .env.example .env.local",
  "bun run dev",
];

export default function Home() {
  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      {/* Navigation */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="Nuvia logo" width={32} height={32} className="rounded-md" />
            <span className="text-lg font-semibold tracking-tight">Nuvia</span>
          </Link>

          <nav aria-label="Page sections" className="hidden items-center gap-8 md:flex">
            <Link
              href="#features"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Features
            </Link>
            <Link
              href="#modules"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Modules
            </Link>
            <Link
              href="#community"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Community
            </Link>
            <Link
              href="#contribute"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Contribute
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <DarkModeToggle />
            <Button variant="ghost" asChild>
              <Link href="/auth/login">Sign in</Link>
            </Button>
            <Button asChild className="active:translate-y-px">
              <Link href="/auth/signup">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero: value proposition on the left, a live component preview on
          the right. The preview uses the same Card, Table, Avatar, and
          Badge components the dashboard renders with. */}
      <section className="overflow-hidden px-6 pb-24 pt-16 md:pt-20">
        <div className="container mx-auto grid max-w-6xl items-center gap-16 lg:grid-cols-2">
          <div>
            <h1 className="landing-rise text-4xl font-bold tracking-tighter md:text-5xl lg:text-6xl">
              Run your association on software you own.
            </h1>
            <p
              className="landing-rise mt-6 max-w-[46ch] text-lg text-muted-foreground"
              style={{ animationDelay: "90ms" }}
            >
              Members, events, content, forums, and jobs. One self-hosted stack: Next.js,
              PostgreSQL, Drizzle, and Bun.
            </p>
            <div
              className="landing-rise mt-8 flex flex-wrap items-center gap-3"
              style={{ animationDelay: "180ms" }}
            >
              <Button size="lg" asChild className="active:translate-y-px">
                <Link href="/auth/signup">Get started</Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="active:translate-y-px">
                <Link href={GITHUB_URL} target="_blank" rel="noreferrer">
                  <GitFork />
                  View source
                </Link>
              </Button>
            </div>
          </div>

          <div className="landing-rise relative pb-10" style={{ animationDelay: "220ms" }}>
            <Card className="relative z-10 shadow-lg">
              <CardHeader>
                <CardTitle>Members</CardTitle>
                <CardDescription>Roll, roles, and renewals</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Member</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {MEMBERS.map((member) => (
                      <TableRow key={member.name} className="hover:bg-transparent">
                        <TableCell>
                          <span className="flex items-center gap-3">
                            <Avatar className="size-8">
                              <AvatarFallback className="text-xs">{member.initials}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium">{member.name}</span>
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{member.role}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">Active</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Overlapping event card for depth. Hidden on small screens
                where the columns stack. */}
            <Card className="absolute -bottom-2 -left-6 z-20 hidden w-56 -rotate-1 shadow-xl md:block">
              <CardContent className="flex items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground">
                  <CalendarDays className="size-5" />
                </span>
                <span>
                  <span className="block text-sm font-medium">Spring Gala</span>
                  <span className="block text-xs text-muted-foreground">Registration open</span>
                </span>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features: bento grid. Cell sizes vary so the section has rhythm
          instead of six identical tiles. */}
      <section id="features" className="border-t border-border/60 px-6 py-24">
        <div className="container mx-auto max-w-6xl">
          <h2 className="max-w-[24ch] text-3xl font-bold tracking-tight md:text-4xl">
            Everything an association runs on
          </h2>
          <p className="mt-4 max-w-[60ch] text-muted-foreground">
            One login, one role system, and a module for each part of the day-to-day, from the
            member roll to the job board.
          </p>

          <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-6">
            <Card className="landing-hover md:col-span-2 lg:col-span-4">
              <CardHeader>
                <CardTitle>Roles that map to your organization</CardTitle>
                <CardDescription>
                  Predefined roles plus custom ones, each with its own permission set. Assign them
                  per member and the interface follows.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {PREDEFINED_ROLES.map((role) => (
                  <Badge key={role} variant="outline">
                    {role}
                  </Badge>
                ))}
              </CardContent>
            </Card>

            <Card className="landing-hover bg-accent/40 lg:col-span-2">
              <CardHeader>
                <span className="flex size-10 items-center justify-center rounded-md bg-background text-accent-foreground shadow-xs">
                  <Layers className="size-5" />
                </span>
                <CardTitle className="mt-4">Membership tiers</CardTitle>
                <CardDescription>
                  Professional, student, and corporate tiers with renewals and member benefits.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="landing-hover lg:col-span-2">
              <CardHeader>
                <span className="flex size-10 items-center justify-center rounded-md bg-accent text-accent-foreground">
                  <CalendarDays className="size-5" />
                </span>
                <CardTitle className="mt-4">Events with check-in</CardTitle>
                <CardDescription>
                  Registration, pricing, and QR check-in for conferences, meetings, and socials.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="landing-hover lg:col-span-2">
              <CardHeader>
                <span className="flex size-10 items-center justify-center rounded-md bg-accent text-accent-foreground">
                  <MessagesSquare className="size-5" />
                </span>
                <CardTitle className="mt-4">Content and forums</CardTitle>
                <CardDescription>
                  Publish articles and announcements, and give members a place to talk.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="landing-hover lg:col-span-2">
              <CardHeader>
                <span className="flex size-10 items-center justify-center rounded-md bg-accent text-accent-foreground">
                  <HandCoins className="size-5" />
                </span>
                <CardTitle className="mt-4">Dues and finance</CardTitle>
                <CardDescription>
                  Invoices, dues, and reporting for treasurers, on the roadmap to live data.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="landing-hover bg-muted/60 md:col-span-2 lg:col-span-6">
              <CardContent className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
                <div className="max-w-xl">
                  <CardTitle className="flex items-center gap-2">
                    <Newspaper className="size-5" />
                    Public pages your community actually sees
                  </CardTitle>
                  <CardDescription className="mt-2">
                    Events and the job board ship with public-facing pages. No login required to
                    browse them.
                  </CardDescription>
                </div>
                <div className="flex shrink-0 flex-wrap gap-3">
                  <Button variant="outline" asChild>
                    <Link href="/events">Browse events</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/jobs">Job board</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Modules: what is backed by a real database today, and what ships
          later. Mirrors the honest status in README and TODO.md. */}
      <section id="modules" className="border-t border-border/60 bg-muted/30 px-6 py-24">
        <div className="container mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1fr_1.2fr] lg:items-start">
          <div>
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Real where it counts</h2>
            <p className="mt-4 max-w-[52ch] text-muted-foreground">
              Five modules run on a real PostgreSQL database today, behind real authentication and
              role checks. The rest ship when they clear the promotion gate: schema, API, tests, and
              docs. Not before.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Live on PostgreSQL</CardTitle>
                <CardDescription>Connected through Drizzle, gated by auth.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {LIVE_MODULES.map((module) => (
                  <Badge key={module} variant="secondary">
                    {module}
                  </Badge>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">On the roadmap</CardTitle>
                <CardDescription>
                  Promoted in this order, by value to an association.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {ROADMAP_MODULES.map((module) => (
                  <Badge key={module} variant="outline">
                    {module}
                  </Badge>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Community */}
      <section id="community" className="border-t border-border/60 px-6 py-24">
        <div className="container mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
          <Image
            src="https://picsum.photos/seed/nuvia-association-meeting/1200/900"
            alt="Attendees talking at an association meeting"
            width={1200}
            height={900}
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="aspect-[4/3] w-full rounded-xl border border-border/60 object-cover shadow-sm"
          />
          <div>
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Built in the open</h2>
            <p className="mt-4 max-w-[52ch] text-muted-foreground">
              Nuvia belongs to the people who run it. The code, the issues, and the roadmap all live
              in public.
            </p>
            <ul className="mt-8 space-y-6">
              <li className="flex gap-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground">
                  <Scale className="size-5" />
                </span>
                <div>
                  <h3 className="font-semibold">MIT licensed</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Run it, modify it, and self-host it. No vendor lock-in.
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground">
                  <GitFork className="size-5" />
                </span>
                <div>
                  <h3 className="font-semibold">Development in the open</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Every issue, decision record, and pull request is public.
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground">
                  <Users className="size-5" />
                </span>
                <div>
                  <h3 className="font-semibold">Shaped by member organizations</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    The roadmap follows what associations need to run, not what trends.
                  </p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Contribute */}
      <section id="contribute" className="border-t border-border/60 bg-muted/30 px-6 py-24">
        <div className="container mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Your first contribution is one clone away
            </h2>
            <p className="mt-4 max-w-[52ch] text-muted-foreground">
              Bun, Docker, and PostgreSQL are all you need. The git hooks, the linter, and the
              isolated test database come with the repo.
            </p>
            <Button size="lg" variant="outline" asChild className="mt-8 active:translate-y-px">
              <Link href={GITHUB_URL} target="_blank" rel="noreferrer">
                <GitFork />
                View source
              </Link>
            </Button>
          </div>

          {/* Real quick-start commands from README.md */}
          <div className="rounded-xl bg-zinc-950 p-6 font-mono text-sm leading-7 text-zinc-100 shadow-lg">
            {QUICK_START.map((command) => (
              <p key={command} className="whitespace-pre-wrap break-all">
                <span className="select-none pr-3 text-zinc-500">$</span>
                {command}
              </p>
            ))}
          </div>
        </div>
      </section>

      {/* Final call to action */}
      <section className="px-6 py-24">
        <div className="container mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 rounded-xl border border-border/60 bg-card p-10 shadow-sm md:flex-row md:items-center">
          <div>
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
              Run your association on Nuvia
            </h2>
            <p className="mt-2 text-muted-foreground">
              Create an account on this instance, or take the source and run your own.
            </p>
          </div>
          <Button size="lg" asChild className="shrink-0 active:translate-y-px">
            <Link href="/auth/signup">Get started</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/60 px-6 py-12">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col justify-between gap-10 md:flex-row">
            <div className="max-w-xs">
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
              <p className="mt-3 text-sm text-muted-foreground">
                Open-source association management: members, events, and everything in between.
              </p>
            </div>

            <div className="flex gap-16">
              <nav aria-label="Explore">
                <h3 className="text-sm font-semibold">Explore</h3>
                <ul className="mt-3 space-y-2 text-sm">
                  <li>
                    <Link
                      href="/events"
                      className="text-muted-foreground transition-colors hover:text-foreground"
                    >
                      Events
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/jobs"
                      className="text-muted-foreground transition-colors hover:text-foreground"
                    >
                      Job board
                    </Link>
                  </li>
                </ul>
              </nav>
              <nav aria-label="Project">
                <h3 className="text-sm font-semibold">Project</h3>
                <ul className="mt-3 space-y-2 text-sm">
                  <li>
                    <Link
                      href={GITHUB_URL}
                      target="_blank"
                      rel="noreferrer"
                      className="text-muted-foreground transition-colors hover:text-foreground"
                    >
                      GitHub
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/auth/login"
                      className="text-muted-foreground transition-colors hover:text-foreground"
                    >
                      Sign in
                    </Link>
                  </li>
                </ul>
              </nav>
            </div>
          </div>

          <div className="mt-10 border-t border-border/60 pt-6 text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} Nuvia. Open source under the MIT License.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
