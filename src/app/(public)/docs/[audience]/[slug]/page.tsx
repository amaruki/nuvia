import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { readFileSync } from "fs";
import {
  AUDIENCE_META,
  DocMarkdown,
  getDocEntry,
  isDocAudience,
  type DocAudience,
  type DocEntry,
} from "@/lib/docs";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export const dynamic = "force-dynamic";

interface DocDetailParams {
  params: Promise<{ audience: string; slug: string }>;
}

export async function generateMetadata({ params }: DocDetailParams): Promise<Metadata> {
  const { audience, slug } = await params;
  if (!isDocAudience(audience)) return { title: "Documentation not found" };
  const entry = getDocEntry(audience, slug);
  if (!entry) return { title: "Documentation not found" };
  return { title: entry.title, description: entry.summary };
}

export default async function DocDetailPage({ params }: DocDetailParams) {
  const { audience, slug } = await params;
  if (!isDocAudience(audience)) notFound();
  const entry = getDocEntry(audience, slug);
  if (!entry) notFound();

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-6 py-12">
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
            <li>
              <Link
                href={`/docs/${audience}`}
                className="underline underline-offset-4 hover:text-foreground"
              >
                {AUDIENCE_META[audience].label}
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-foreground">
              {entry.title}
            </li>
          </ol>
        </nav>

        <article className="mt-8 pb-24">
          {entry.status === "available" ? (
            <>
              <RenderedDoc entry={entry} />
              <footer className="mt-12 border-t border-border pt-4 text-sm text-muted-foreground">
                Rendered from{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.875em]">
                  docs/{entry.repoPath}
                </code>{" "}
                in this repository.
              </footer>
            </>
          ) : (
            <MissingDocNotice entry={entry} audience={audience} />
          )}
        </article>
      </div>
    </div>
  );
}

function RenderedDoc({ entry }: { entry: DocEntry }) {
  const markdown = readFileSync(entry.filePath as string, "utf8");
  return <DocMarkdown markdown={markdown} sourceRepoPath={entry.repoPath ?? undefined} />;
}

function MissingDocNotice({ entry, audience }: { entry: DocEntry; audience: DocAudience }) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-card/50 p-8 text-center">
      <p className="inline-block rounded-full border border-border bg-muted px-3 py-1 text-sm font-medium text-muted-foreground">
        {entry.missingBadge ?? "Not written yet"}
      </p>
      <h1 className="mt-4 text-2xl font-bold tracking-tight text-foreground">{entry.title}</h1>
      <p className="mx-auto mt-3 max-w-md text-muted-foreground">
        This page is listed honestly: no markdown file backs it in the{" "}
        <code className="rounded bg-muted px-1 py-0.5 font-mono text-[0.875em]">docs/</code> tree
        yet, so there is no content to show. We do not publish placeholder documentation.
      </p>
      <Link
        href={`/docs/${audience}`}
        className="mt-6 inline-block rounded-md border border-border bg-card px-4 py-2 font-medium text-foreground hover:bg-accent"
      >
        Back to {AUDIENCE_META[audience].label}
      </Link>
    </div>
  );
}
