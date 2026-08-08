import Link from "next/link";
import { GitFork, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { GITHUB_URL, QUICK_START } from "./landing-data";

export function ContributeSection() {
  return (
    <section id="contribute" className="scroll-mt-20 bg-muted/40 px-4 pb-28 pt-24 sm:px-6 lg:px-8">
      <div className="landing-reveal container mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[0.8fr_1.2fr]">
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
  );
}
