import Link from "next/link";
import { ArrowRight } from "lucide-react";
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
  );
}
