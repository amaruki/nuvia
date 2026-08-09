import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AUDIENCE_META, isDocAudience, listDocsForAudience } from "@/lib/docs";
import { DocEntryCards } from "../_components/doc-entry-cards";

export const dynamic = "force-dynamic";

interface AudienceParams {
  params: Promise<{ audience: string }>;
}

export async function generateMetadata({ params }: AudienceParams): Promise<Metadata> {
  const { audience } = await params;
  if (!isDocAudience(audience)) return { title: "Documentation not found" };
  return {
    title: `${AUDIENCE_META[audience].label} documentation`,
    description: AUDIENCE_META[audience].description,
  };
}

export default async function DocsAudiencePage({ params }: AudienceParams) {
  const { audience } = await params;
  if (!isDocAudience(audience)) notFound();

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-6 py-12">
        <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link href="/" className="underline underline-offset-4 hover:text-foreground">
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link href="/docs" className="underline underline-offset-4 hover:text-foreground">
                Documentation
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-foreground">
              {AUDIENCE_META[audience].label}
            </li>
          </ol>
        </nav>

        <header className="mt-6 mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {AUDIENCE_META[audience].label}
          </h1>
          <p className="mt-2 text-muted-foreground">{AUDIENCE_META[audience].description}</p>
        </header>

        <div className="pb-24">
          <DocEntryCards audience={audience} entries={listDocsForAudience(audience)} />
        </div>
      </div>
    </div>
  );
}
