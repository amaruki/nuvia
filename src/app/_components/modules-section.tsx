import { Database, Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { LIVE_MODULES, PROMOTION_GATE, ROADMAP_MODULES } from "./landing-data";

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
            Modules are listed exactly as the maturity registry reports them. Live entries run on
            real PostgreSQL behind authentication and role checks, and an entry appears on the
            roadmap only while its flag says it has not cleared the gate yet.
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
                  <h3 className="font-semibold">Roadmap</h3>
                  <p className="text-sm text-muted-foreground">
                    {ROADMAP_MODULES.length > 0
                      ? "Listed only while the maturity flag says a module is not live yet."
                      : "The promotion queue is empty right now."}
                  </p>
                </div>
              </div>
              {ROADMAP_MODULES.length > 0 ? (
                <ul className="mt-6 flex flex-col gap-3">
                  {ROADMAP_MODULES.map((module) => (
                    <li
                      key={module}
                      className="flex items-center justify-between gap-4 rounded-lg border bg-muted/40 px-4 py-3"
                    >
                      <span className="font-medium">{module}</span>
                      <Badge variant="outline">Upcoming</Badge>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="mt-6 flex flex-col gap-5">
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Every module in the registry has cleared the promotion gate, so nothing is
                    presented as upcoming today. A new module appears here only while its maturity
                    flag says it has not cleared the gate yet.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {PROMOTION_GATE.map((requirement) => (
                      <span
                        key={requirement}
                        className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2 text-xs"
                      >
                        <span aria-hidden="true" className="size-1.5 rounded-full bg-primary/60" />
                        {requirement}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
