import Link from "next/link";
import { ArrowUpRight, CalendarDays, CircleCheck, GitFork } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { GITHUB_URL, MEMBERS, STACK } from "./landing-data";

export function HeroSection() {
  return (
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
            Members, events, content, forums, and jobs are live on PostgreSQL today. Nuvia keeps the
            rest of the roadmap visible instead of pretending mock screens are finished.
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
                <CardDescription className="mt-1">Roll, roles, and account status</CardDescription>
              </div>
              <Badge variant="secondary">Dashboard preview</Badge>
            </CardHeader>
            <CardContent className="px-0">
              <Table>
                <TableCaption className="sr-only">Sample member directory in Nuvia</TableCaption>
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
  );
}
