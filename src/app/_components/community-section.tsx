import Link from "next/link";
import {
  FileCode2,
  GitBranch,
  GitFork,
  GitPullRequest,
  MessagesSquare,
  Scale,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { GITHUB_URL } from "./landing-data";

export function CommunitySection() {
  return (
    <section
      id="community"
      className="relative scroll-mt-20 overflow-hidden px-4 py-24 sm:px-6 md:py-32 lg:px-8"
    >
      <div
        aria-hidden="true"
        className="absolute inset-y-0 left-0 -z-10 w-1/2 bg-gradient-to-r from-accent/40 to-transparent"
      />
      <div className="landing-reveal container mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[1.1fr_0.9fr]">
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
                  <p className="font-mono text-xs uppercase tracking-wider text-primary">Issue</p>
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
                  <p className="font-mono text-xs uppercase tracking-wider text-primary">Change</p>
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
  );
}
