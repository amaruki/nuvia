import type { Metadata } from "next";
import Link from "next/link";
import { AUDIENCES, AUDIENCE_META, listDocsForAudience } from "@/lib/docs";
import { DocEntryCards } from "./_components/doc-entry-cards";

// Rendered at request time from the docs/ tree — D14 keeps the tree the
// single source of truth, so no build-time snapshot may go stale.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Documentation",
  description:
    "Usage guides, developer documentation, and operator runbooks for this Nuvia instance, rendered from the docs/ tree in the repository.",
};

export default function DocsLandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-6 py-12">
        <header className="mb-12">
          <Link
            href="/"
            className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            ← Back to home
          </Link>
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-foreground">Documentation</h1>
          <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
            Everything below is rendered directly from the{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.875em]">docs/</code>{" "}
            tree in this repository. Pages listed with a &ldquo;not written yet&rdquo; badge
            genuinely have no content — we do not publish placeholders.
          </p>
        </header>

        <div className="space-y-14 pb-24">
          {AUDIENCES.map((audience) => (
            <section key={audience} aria-labelledby={`docs-audience-${audience}`}>
              <h2
                id={`docs-audience-${audience}`}
                className="text-2xl font-semibold tracking-tight text-foreground"
              >
                <Link href={`/docs/${audience}`} className="hover:underline underline-offset-4">
                  {AUDIENCE_META[audience].label}
                </Link>
              </h2>
              <p className="mt-1 text-muted-foreground">{AUDIENCE_META[audience].description}</p>
              <DocEntryCards
                audience={audience}
                entries={listDocsForAudience(audience).filter((entry) => entry.onLanding)}
                className="mt-5"
              />
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
