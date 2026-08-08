import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  CircleCheck,
  Database,
  FileCode2,
  GitBranch,
  GitFork,
  GitPullRequest,
  HandCoins,
  Layers,
  LockKeyhole,
  MessagesSquare,
  Newspaper,
  Scale,
  Terminal,
  Users,
} from "lucide-react";
import { DarkModeToggle } from "@/components/ui/dark-mode-toggle";
import { MobileNav } from "@/components/landing/mobile-nav";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";

const GITHUB_URL = "https://github.com/amaruki/nuvia";

const NAV_LINKS = [
  { href: "#features", label: "Features" },
  { href: "#modules", label: "Modules" },
  { href: "#community", label: "Community" },
  { href: "#contribute", label: "Contribute" },
] as const;

// Animated underline on hover; transform-only so it stays GPU-composited.
const NAV_LINK_CLASS =
  "relative text-sm text-muted-foreground transition-colors hover:text-foreground after:absolute after:-bottom-1.5 after:left-0 after:h-px after:w-full after:origin-left after:scale-x-0 after:bg-foreground after:transition-transform after:duration-300 hover:after:scale-x-100 motion-reduce:after:transition-none";

const FOOTER_LINK_CLASS = "text-muted-foreground transition-colors hover:text-foreground";

const MEMBERS = [
  { initials: "PR", name: "Priya Raman", role: "Committee chair" },
  { initials: "DO", name: "Daniel Okafor", role: "Member" },
  { initials: "SA", name: "Sofia Almeida", role: "Organizer" },
  { initials: "MC", name: "Mei-Lin Chen", role: "Treasurer" },
] as const;

const PREDEFINED_ROLES = [
  "Superadmin",
  "Admin",
  "Treasurer",
  "Committee chair",
  "Organizer",
  "Member",
] as const;

const LIVE_MODULES = ["Members", "Events", "Content", "Forums", "Jobs"] as const;

// Promotion order comes from TODO.md: by value to an association.
const ROADMAP_MODULES = [
  "Finance and dues",
  "Chapters",
  "Committees",
  "Learning",
  "Awards",
  "Workspaces",
] as const;

const PROMOTION_GATE = ["Schema", "Authorized API", "Tests", "Documentation"] as const;

const STACK = ["Next.js 16", "React 19", "PostgreSQL", "Drizzle", "Bun"] as const;

const QUICK_START = [
  "git clone https://github.com/amaruki/nuvia.git",
  "cd nuvia",
  "bun install",
  "cp .env.example .env.local",
  "bun run dev",
] as const;

export default function Home() {
  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="Nuvia logo" width={32} height={32} className="rounded-md" />
            <span className="text-lg font-semibold tracking-tight">Nuvia</span>
          </Link>

          <nav aria-label="Page sections" className="hidden items-center gap-8 md:flex">
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

      <main>
        <section className="relative isolate overflow-hidden px-4 pb-24 pt-16 sm:px-6 md:pb-32 md:pt-24 lg:px-8">
          <div
            aria-hidden="true"
            className="absolute inset-x-0 top-0 -z-10 h-96 bg-gradient-to-b from-primary/10 via-accent/30 to-transparent"
          />
          <div
            aria-hidden="true"
            className="absolute left-1/2 top-12 -z-10 size-80 -translate-x-1/2 rounded-full bg-primary/15 blur-3xl"
          />

          <div className="container mx-auto grid max-w-6xl items-center gap-16 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
            <div>
              <div className="landing-rise">
                <Badge variant="outline">
                  <CircleCheck />
                  Open source and self-hosted
                </Badge>
              </div>
              <h1
                className="landing-rise mt-6 text-5xl font-semibold leading-none tracking-tighter sm:text-6xl lg:text-7xl"
                style={{ animationDelay: "60ms" }}
              >
                Run your association.
                <span className="block text-primary">Own the software.</span>
              </h1>
              <p
                className="landing-rise mt-6 max-w-[48ch] text-lg leading-relaxed text-muted-foreground"
                style={{ animationDelay: "120ms" }}
              >
                Members, events, content, forums, and jobs are live on PostgreSQL today. Nuvia keeps
                the rest of the roadmap visible instead of pretending mock screens are finished.
              </p>
              <div
                className="landing-rise mt-8 flex flex-wrap items-center gap-3"
                style={{ animationDelay: "180ms" }}
              >
                <Button size="lg" asChild>
                  <Link href="/auth/signup">Get started</Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href={GITHUB_URL} target="_blank" rel="noreferrer">
                    <GitFork />
                    View source
                  </Link>
                </Button>
              </div>
              <div
                className="landing-rise mt-10 flex flex-wrap gap-x-5 gap-y-2 border-t border-border/60 pt-5 font-mono text-xs text-muted-foreground"
                style={{ animationDelay: "240ms" }}
              >
                {STACK.map((technology) => (
                  <span key={technology}>{technology}</span>
                ))}
              </div>
            </div>

            <div
              className="landing-rise relative mx-auto w-full max-w-xl pb-8 sm:pb-16"
              style={{ animationDelay: "200ms" }}
            >
              <div
                aria-hidden="true"
                className="absolute inset-x-8 bottom-14 top-10 rotate-2 rounded-xl border border-primary/20 bg-primary/5 shadow-lg shadow-primary/10"
              />
              <Card className="relative z-10 gap-0 overflow-hidden border-primary/20 bg-card/95 py-0 shadow-2xl shadow-primary/10 backdrop-blur-xl">
                <CardHeader className="flex flex-row items-center justify-between gap-4 border-b border-border/70 bg-muted/40 px-5 py-4">
                  <div>
                    <CardTitle className="text-base">Members</CardTitle>
                    <CardDescription className="mt-1">
                      Roll, roles, and account status
                    </CardDescription>
                  </div>
                  <Badge variant="secondary">Dashboard preview</Badge>
                </CardHeader>
                <CardContent className="px-0">
                  <Table>
                    <TableCaption className="sr-only">
                      Sample member directory in Nuvia
                    </TableCaption>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="pl-5">Member</TableHead>
                        <TableHead className="hidden sm:table-cell">Role</TableHead>
                        <TableHead className="pr-5">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {MEMBERS.map((member) => (
                        <TableRow key={member.name} className="hover:bg-transparent">
                          <TableCell className="pl-5">
                            <span className="flex items-center gap-3">
                              <Avatar className="size-8">
                                <AvatarFallback className="bg-primary/10 text-xs text-primary">
                                  {member.initials}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm font-medium">{member.name}</span>
                            </span>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <Badge variant="secondary">{member.role}</Badge>
                          </TableCell>
                          <TableCell className="pr-5">
                            <Badge variant="outline">Active</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Link
                href="/events"
                aria-label="Browse public events"
                className="landing-hover group relative z-20 mt-4 block rounded-xl sm:absolute sm:-bottom-6 sm:-right-4 sm:mt-0 sm:w-64"
              >
                <Card className="gap-0 border-primary/30 bg-card/95 py-0 shadow-xl shadow-primary/10 backdrop-blur-xl sm:rotate-2">
                  <CardContent className="flex items-center gap-3 p-4">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <CalendarDays className="size-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs font-medium text-primary">Events</span>
                      <span className="block truncate text-sm font-semibold">Spring Gala</span>
                      <span className="block text-xs text-muted-foreground">Public event page</span>
                    </span>
                    <ArrowUpRight className="size-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transform-none motion-reduce:transition-none" />
                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>
        </section>

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
                One login and one access model for the daily work that is live now, with roadmap
                modules labelled honestly until they clear the promotion gate.
              </p>
            </div>

            <div className="mt-12 grid gap-4 md:grid-cols-6">
              <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-card via-card to-accent/40 md:col-span-4">
                <div
                  aria-hidden="true"
                  className="absolute -right-10 -top-10 size-40 rounded-full bg-primary/10 blur-3xl"
                />
                <CardHeader className="relative">
                  <Badge variant="secondary">Access model</Badge>
                  <CardTitle className="mt-3 text-2xl">
                    Roles that map to your organization
                  </CardTitle>
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
                        Six predefined roles cover common association responsibilities.
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
                    <Badge variant="outline">Roadmap</Badge>
                  </div>
                  <CardTitle className="mt-3">Membership tiers</CardTitle>
                  <CardDescription className="leading-relaxed">
                    Tier, renewal, and dues models promote together only after schema, API, tests,
                    and documentation exist.
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
                    The Events module and its public browsing route run on PostgreSQL through
                    Drizzle.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-border/70 md:col-span-3">
                <CardHeader>
                  <div className="flex items-center justify-between gap-4">
                    <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <MessagesSquare className="size-5" />
                    </span>
                    <Badge>Two live modules</Badge>
                  </div>
                  <CardTitle className="mt-3">Content and forums</CardTitle>
                  <CardDescription className="leading-relaxed">
                    Publish content and give members a place to talk without splitting identity
                    across separate tools.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-border/70 bg-muted/50 md:col-span-2">
                <CardHeader>
                  <div className="flex items-center justify-between gap-4">
                    <span className="flex size-10 items-center justify-center rounded-lg bg-background text-primary shadow-xs">
                      <HandCoins className="size-5" />
                    </span>
                    <Badge variant="outline">Next to promote</Badge>
                  </div>
                  <CardTitle className="mt-3">Dues and finance</CardTitle>
                  <CardDescription className="leading-relaxed">
                    Highest product value, first in the promotion queue, and still clearly marked as
                    roadmap work.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-primary bg-primary text-primary-foreground md:col-span-4">
                <CardContent className="flex h-full flex-col justify-between gap-8 lg:flex-row lg:items-center">
                  <div className="max-w-xl">
                    <span className="flex size-10 items-center justify-center rounded-lg bg-primary-foreground/10">
                      <Newspaper className="size-5" />
                    </span>
                    <CardTitle className="mt-4 text-xl">
                      Public pages your community can use
                    </CardTitle>
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

        <section
          id="modules"
          className="scroll-mt-20 bg-muted/50 px-4 py-24 sm:px-6 md:py-28 lg:px-8"
        >
          <div className="container mx-auto max-w-6xl">
            <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
              <div>
                <Badge>Product status</Badge>
                <h2 className="mt-4 text-4xl font-semibold tracking-tighter md:text-5xl">
                  Real where it counts
                </h2>
              </div>
              <p className="max-w-[62ch] text-base leading-relaxed text-muted-foreground lg:justify-self-end">
                Five modules run on real PostgreSQL today, behind authentication and role checks.
                The roadmap promotes in value order only after each module has a schema, authorized
                API, tests, and documentation.
              </p>
            </div>

            <Card className="mt-12 gap-0 overflow-hidden py-0 shadow-none">
              <CardContent className="grid px-0 md:grid-cols-[0.9fr_1.1fr]">
                <div className="bg-card p-6 md:p-8">
                  <div className="flex items-center gap-3">
                    <Database className="size-5 text-primary" />
                    <div>
                      <h3 className="font-semibold">Live on PostgreSQL</h3>
                      <p className="text-sm text-muted-foreground">Connected through Drizzle.</p>
                    </div>
                  </div>
                  <ul className="mt-6 flex flex-col gap-3">
                    {LIVE_MODULES.map((module) => (
                      <li
                        key={module}
                        className="flex items-center justify-between gap-4 rounded-lg border bg-background/70 px-4 py-3"
                      >
                        <span className="font-medium">{module}</span>
                        <Badge variant="secondary">Live</Badge>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="border-t bg-background/60 p-6 md:border-l md:border-t-0 md:p-8">
                  <div className="flex items-center gap-3">
                    <Layers className="size-5 text-primary" />
                    <div>
                      <h3 className="font-semibold">Roadmap promotion order</h3>
                      <p className="text-sm text-muted-foreground">
                        Ordered by value to an association.
                      </p>
                    </div>
                  </div>
                  <ol className="mt-6 grid gap-3 sm:grid-cols-2">
                    {ROADMAP_MODULES.map((module, index) => (
                      <li
                        key={module}
                        className="flex items-center gap-3 rounded-lg border bg-muted/40 p-3"
                      >
                        <span className="font-mono text-xs tabular-nums text-primary">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <span className="text-sm font-medium">{module}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section
          id="community"
          className="relative scroll-mt-20 overflow-hidden px-4 py-24 sm:px-6 md:py-32 lg:px-8"
        >
          <div
            aria-hidden="true"
            className="absolute inset-y-0 left-0 -z-10 w-1/2 bg-gradient-to-r from-accent/40 to-transparent"
          />
          <div className="container mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="relative">
              <div
                aria-hidden="true"
                className="absolute inset-8 -z-10 rounded-full bg-primary/15 blur-3xl"
              />
              <Card className="gap-0 overflow-hidden border-primary/20 py-0 shadow-xl shadow-primary/10">
                <CardHeader className="flex flex-row items-center justify-between gap-4 border-b bg-muted/40 px-5 py-4">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <GitBranch className="size-4 text-primary" />
                    nuvia / public
                  </CardTitle>
                  <Badge variant="outline">MIT</Badge>
                </CardHeader>
                <CardContent className="px-0">
                  <div className="flex items-start gap-4 p-5">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <MessagesSquare className="size-5" />
                    </span>
                    <div>
                      <p className="font-mono text-xs uppercase tracking-wider text-primary">
                        Issue
                      </p>
                      <p className="mt-1 font-medium">Needs are discussed in public</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Scope starts with the people who operate member organizations.
                      </p>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-start gap-4 p-5">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <FileCode2 className="size-5" />
                    </span>
                    <div>
                      <p className="font-mono text-xs uppercase tracking-wider text-primary">
                        Decision
                      </p>
                      <p className="mt-1 font-medium">Trade-offs stay in the record</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Architecture decision records explain why the project chose one path.
                      </p>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-start gap-4 p-5">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <GitPullRequest className="size-5" />
                    </span>
                    <div>
                      <p className="font-mono text-xs uppercase tracking-wider text-primary">
                        Change
                      </p>
                      <p className="mt-1 font-medium">Contributions remain reviewable</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        The source, standards, roadmap, and pull requests share one public home.
                      </p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="gap-3 border-t bg-primary/10 px-5 py-4 text-sm">
                  <GitFork className="size-4 text-primary" />
                  Fork it, adapt it, and run it on infrastructure you control.
                </CardFooter>
              </Card>
            </div>

            <div>
              <p className="font-mono text-xs font-medium uppercase tracking-widest text-primary">
                Community is infrastructure
              </p>
              <h2 className="mt-4 text-4xl font-semibold tracking-tighter md:text-5xl">
                Built in the open
              </h2>
              <p className="mt-5 max-w-[52ch] leading-relaxed text-muted-foreground">
                Nuvia belongs to the people who run it. The code, issue tracker, roadmap, and the
                reasoning behind contested decisions all live in public.
              </p>
              <ul className="mt-8 flex flex-col gap-6">
                <li className="flex gap-4">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                    <Scale className="size-5" />
                  </span>
                  <div>
                    <h3 className="font-semibold">MIT licensed</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Run it, modify it, and self-host it without vendor lock-in.
                    </p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                    <GitFork className="size-5" />
                  </span>
                  <div>
                    <h3 className="font-semibold">Development in the open</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Issues, decision records, and pull requests stay public.
                    </p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                    <Users className="size-5" />
                  </span>
                  <div>
                    <h3 className="font-semibold">Built for member organizations</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      The roadmap follows operational value, not feature-page theatre.
                    </p>
                  </div>
                </li>
              </ul>
              <Button size="lg" variant="outline" asChild className="mt-8">
                <Link href={GITHUB_URL} target="_blank" rel="noreferrer">
                  <GitFork />
                  View repository
                </Link>
              </Button>
            </div>
          </div>
        </section>

        <section
          id="contribute"
          className="scroll-mt-20 bg-muted/40 px-4 pb-28 pt-24 sm:px-6 lg:px-8"
        >
          <div className="container mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="font-mono text-xs font-medium uppercase tracking-widest text-primary">
                Contributor path
              </p>
              <h2 className="mt-4 text-4xl font-semibold tracking-tighter md:text-5xl">
                Your first contribution is one clone away
              </h2>
              <p className="mt-5 max-w-[52ch] leading-relaxed text-muted-foreground">
                Bun, Docker, PostgreSQL, and Redis are the local prerequisites. Git hooks, oxlint,
                oxfmt, and the isolated integration-test services come with the repository.
              </p>
              <Button size="lg" variant="outline" asChild className="mt-8">
                <Link href={GITHUB_URL} target="_blank" rel="noreferrer">
                  <GitFork />
                  View source
                </Link>
              </Button>
            </div>

            <Card className="gap-0 overflow-hidden border-border/80 bg-card py-0 shadow-xl">
              <CardHeader className="flex flex-row items-center justify-between gap-4 border-b bg-muted/60 px-5 py-4">
                <CardTitle className="flex items-center gap-2 font-mono text-sm font-medium">
                  <Terminal className="size-4 text-primary" />
                  nuvia / local setup
                </CardTitle>
                <Badge variant="outline">Bun</Badge>
              </CardHeader>
              <CardContent className="bg-muted/30 p-5 font-mono text-sm leading-7 sm:p-6">
                {QUICK_START.map((command) => (
                  <p key={command} className="grid grid-cols-[auto_1fr] gap-3">
                    <span className="select-none text-primary">$</span>
                    <span className="break-all text-card-foreground">{command}</span>
                  </p>
                ))}
              </CardContent>
              <CardFooter className="border-t bg-muted/30 px-5 py-4 text-xs text-muted-foreground">
                The README covers database setup and the generated admin secret.
              </CardFooter>
            </Card>
          </div>
        </section>

        <section className="px-4 py-24 sm:px-6 lg:px-8">
          <div className="container mx-auto max-w-6xl">
            <div className="relative overflow-hidden rounded-xl bg-primary p-8 text-primary-foreground shadow-xl shadow-primary/20 md:p-12">
              <div
                aria-hidden="true"
                className="absolute -right-12 -top-12 size-48 rounded-full border border-primary-foreground/15"
              />
              <div
                aria-hidden="true"
                className="absolute -right-4 -top-4 size-32 rounded-full border border-primary-foreground/15"
              />
              <div className="relative flex flex-col items-start justify-between gap-8 md:flex-row md:items-end">
                <div className="max-w-2xl">
                  <p className="font-mono text-xs uppercase tracking-widest text-primary-foreground/70">
                    Start here
                  </p>
                  <h2 className="mt-3 text-3xl font-semibold tracking-tighter md:text-4xl">
                    Run your association on Nuvia
                  </h2>
                  <p className="mt-3 max-w-[56ch] text-primary-foreground/75">
                    Create an account on this instance, or take the MIT-licensed source and run your
                    own.
                  </p>
                </div>
                <Button size="lg" variant="secondary" asChild className="group shrink-0">
                  <Link href="/auth/signup">
                    Get started
                    <ArrowRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transform-none motion-reduce:transition-none" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

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
    </div>
  );
}
