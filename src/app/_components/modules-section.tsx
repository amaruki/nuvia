import { Database, Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { LIVE_MODULES, ROADMAP_MODULES } from "./landing-data";

export function ModulesSection() {
  return (
    <section id="modules" className="scroll-mt-20 bg-muted/50 px-4 py-24 sm:px-6 md:py-28 lg:px-8">
      <div className="container mx-auto max-w-6xl">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
          <div>
            <Badge>Product status</Badge>
            <h2 className="mt-4 text-4xl font-semibold tracking-tighter md:text-5xl">
              Real where it counts
            </h2>
          </div>
          <p className="max-w-[62ch] text-base leading-relaxed text-muted-foreground lg:justify-self-end">
            Five modules run on real PostgreSQL today, behind authentication and role checks. The
            roadmap promotes in value order only after each module has a schema, authorized API,
            tests, and documentation.
          </p>
        </div>

        <Card className="landing-reveal mt-12 gap-0 overflow-hidden py-0 shadow-none">
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
  );
}
