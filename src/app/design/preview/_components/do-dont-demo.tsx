"use client";

import type { ReactNode } from "react";
import { Rocket } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function Tile({
  kind,
  code,
  children,
}: {
  kind: "do" | "dont";
  code?: string;
  children: ReactNode;
}) {
  const isDont = kind === "dont";
  return (
    <div
      className={cn(
        "rounded-lg bg-card p-4 ring-1",
        isDont ? "ring-destructive/40" : "ring-border",
      )}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <Badge variant={isDont ? "destructive" : "secondary"}>{isDont ? "Don't" : "Do"}</Badge>
        {code ? <code className="text-xs text-muted-foreground">{code}</code> : null}
      </div>
      {children}
    </div>
  );
}

function ComparisonRow({
  title,
  description,
  dont,
  doTile,
}: {
  title: string;
  description: string;
  dont: ReactNode;
  doTile: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="space-y-1">
        <h3 className="text-sm font-medium">{title}</h3>
        <p className="max-w-3xl text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {dont}
        {doTile}
      </div>
    </section>
  );
}

export function DoDontDemo() {
  return (
    <div className="space-y-10">
      <ComparisonRow
        title="Color: tokens instead of raw palette classes"
        description="The public jobs page CTA hardcoded from-blue-50 and to-purple-50 in src/app/(public)/jobs/page.tsx. Raw palette classes bypass theming and stay light in dark mode. Build gradients from tokens instead, or use bg-muted with border-border."
        dont={
          <Tile kind="dont" code="bg-gradient-to-r from-blue-50 to-purple-50">
            <div className="rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 p-6 text-center">
              <h4 className="mb-1 text-base font-semibold">
                Don&apos;t see what you&apos;re looking for?
              </h4>
              <p className="text-sm text-muted-foreground">
                Open roles refresh as partner companies post them.
              </p>
            </div>
          </Tile>
        }
        doTile={
          <Tile kind="do" code="bg-gradient-to-r from-primary/10 to-accent/60">
            <div className="rounded-xl border border-border bg-gradient-to-r from-primary/10 to-accent/60 p-6 text-center">
              <h4 className="mb-1 text-base font-semibold">
                Don&apos;t see what you&apos;re looking for?
              </h4>
              <p className="text-sm text-muted-foreground">
                Open roles refresh as partner companies post them.
              </p>
            </div>
          </Tile>
        }
      />

      <ComparisonRow
        title="Copy: two sentences instead of an em dash clause"
        description="The jobs CTA joined two sentences with an em dash. This quote is verbatim from src/app/(public)/jobs/page.tsx. House copy splits the clause into two sentences."
        dont={
          <Tile kind="dont">
            <div className="rounded-xl border border-border bg-muted p-4">
              <p className="text-sm text-muted-foreground">
                Check back soon — we are always looking for talented people to join our partner
                companies.
              </p>
            </div>
          </Tile>
        }
        doTile={
          <Tile kind="do">
            <div className="rounded-xl border border-border bg-muted p-4">
              <p className="text-sm text-muted-foreground">
                Check back soon. We are always looking for talented people to join our partner
                companies.
              </p>
            </div>
          </Tile>
        }
      />

      <ComparisonRow
        title="Status colors: Badge variants instead of palette text"
        description="The award nominations page maps statuses to Badge variants: under review to secondary, pending to outline, rejected to destructive. Hardcoded text-green-600 and text-red-600 skip the token system and do not adapt to the theme."
        dont={
          <Tile kind="dont" code="text-green-600, text-red-600">
            <ul className="space-y-2 text-sm font-medium">
              <li>
                <span className="text-green-600">Under review</span>
              </li>
              <li>
                <span className="text-red-600">Pending</span>
              </li>
              <li>
                <span className="text-red-600">Rejected</span>
              </li>
            </ul>
          </Tile>
        }
        doTile={
          <Tile kind="do" code="Badge variants: secondary, outline, destructive">
            <ul className="space-y-2">
              <li>
                <Badge variant="secondary">Under review</Badge>
              </li>
              <li>
                <Badge variant="outline">Pending</Badge>
              </li>
              <li>
                <Badge variant="destructive">Rejected</Badge>
              </li>
            </ul>
          </Tile>
        }
      />

      <ComparisonRow
        title="Icons: lucide components instead of emoji"
        description="Emoji render differently across platforms and ignore color and size tokens. Use lucide icons marked aria-hidden so assistive tech only announces the button label."
        dont={
          <Tile kind="dont">
            <Button>🚀 Publish</Button>
          </Tile>
        }
        doTile={
          <Tile kind="do">
            <Button>
              <Rocket aria-hidden="true" />
              Publish
            </Button>
          </Tile>
        }
      />
    </div>
  );
}
