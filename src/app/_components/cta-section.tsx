import Link from "next/link";
import { ArrowRight, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CtaSection() {
  return (
    <section className="px-4 py-24 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-6xl">
        <div className="landing-reveal relative overflow-hidden rounded-xl bg-primary p-8 text-primary-foreground shadow-xl shadow-primary/20 md:p-12">
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
                own. Both paths start here.
              </p>
            </div>
            <div className="flex w-full shrink-0 flex-col gap-3 sm:w-auto">
              <Button size="lg" variant="secondary" asChild className="group">
                <Link href="/auth/signup">
                  Create an account on this instance
                  <ArrowRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transform-none motion-reduce:transition-none" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="group border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground dark:border-primary-foreground/40 dark:bg-transparent dark:hover:bg-primary-foreground/10"
              >
                <Link href="/#quick-start">
                  <Terminal className="size-4" />
                  Self-host with the MIT source
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
