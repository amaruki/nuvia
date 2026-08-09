import Link from "next/link";
import type { DocAudience, DocEntry } from "@/lib/docs";
import { docHref } from "@/lib/docs";

interface DocEntryCardsProps {
  audience: DocAudience;
  entries: DocEntry[];
  className?: string;
}

/**
 * One card per registry entry. Available entries link to their rendered
 * page; missing entries link too, but wear an honest "not written yet"
 * badge — the detail page shows the honest state, never invented content.
 */
export function DocEntryCards({ audience, entries, className = "" }: DocEntryCardsProps) {
  return (
    <ul className={`grid gap-3 sm:grid-cols-2 ${className}`.trim()}>
      {entries.map((entry) => (
        <li key={entry.slug}>
          <Link
            href={docHref({ audience, slug: entry.slug })}
            className={`block h-full rounded-lg border p-4 transition-colors hover:bg-accent ${
              entry.status === "available"
                ? "border-border bg-card"
                : "border-dashed border-border bg-card/50"
            }`}
          >
            <span
              className={`block font-medium ${entry.status === "available" ? "text-foreground" : "text-muted-foreground"}`}
            >
              {entry.title}
            </span>
            <span className="mt-1 block text-sm text-muted-foreground">{entry.summary}</span>
            {entry.status === "missing" && (
              <span className="mt-3 inline-block rounded-full border border-border bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                {entry.missingBadge ?? "Not written yet"}
              </span>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}
