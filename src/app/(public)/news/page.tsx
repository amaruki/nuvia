import Link from "next/link";
import { format } from "date-fns";
import { listPublicNews, NEWS_TYPES, type NewsType } from "@/lib/services/content/public-news";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

const TYPE_LABELS: Record<NewsType, string> = {
  ARTICLE: "Articles",
  ANNOUNCEMENT: "Announcements",
  PUBLICATION: "Publications",
};

function parseType(value: string | string[] | undefined): NewsType | undefined {
  if (typeof value !== "string") return undefined;
  const upper = value.toUpperCase();
  return (NEWS_TYPES as readonly string[]).includes(upper) ? (upper as NewsType) : undefined;
}

function parsePage(value: string | string[] | undefined): number {
  if (typeof value !== "string") return 1;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function pageHref(page: number, type?: NewsType): string {
  const params = new URLSearchParams();
  if (type) params.set("type", type);
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `/news?${qs}` : "/news";
}

export default async function PublicNewsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const type = parseType(sp.type);
  const page = parsePage(sp.page);

  const result = await listPublicNews({ type, page, limit: 10 });
  const { items, total, totalPages } = result;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-6">
        {/* Hero */}
        <div className="text-center py-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            News
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            Articles, announcements, and publications from our community.
          </p>

          {/* Type filter chips (one feed for all three types — D9) */}
          <div className="flex flex-wrap justify-center gap-2">
            <Badge asChild variant={!type ? "default" : "outline"} className="text-sm px-4 py-1.5">
              <Link href="/news" aria-current={!type ? "page" : undefined}>
                All
              </Link>
            </Badge>
            {NEWS_TYPES.map((t) => (
              <Badge
                key={t}
                asChild
                variant={type === t ? "default" : "outline"}
                className="text-sm px-4 py-1.5"
              >
                <Link href={pageHref(1, t)} aria-current={type === t ? "page" : undefined}>
                  {TYPE_LABELS[t]}
                </Link>
              </Badge>
            ))}
          </div>
        </div>

        {/* Results */}
        <div className="mb-6 text-muted-foreground">
          {total} post{total === 1 ? "" : "s"}
          {type ? ` · ${TYPE_LABELS[type]}` : ""}
        </div>

        {items.length === 0 ? (
          <div className="text-center py-16 border rounded-lg bg-card">
            <h3 className="text-lg font-medium mb-2">
              {type
                ? `No ${TYPE_LABELS[type].toLowerCase()} published yet`
                : "Nothing published yet"}
            </h3>
            <p className="text-muted-foreground">
              {type
                ? "Check back soon — new items appear here as soon as they are published."
                : "When articles, announcements, or publications are published, they will appear here."}
            </p>
            {type && (
              <Link
                href="/news"
                className="inline-block mt-4 text-blue-600 dark:text-blue-400 hover:underline"
              >
                Show all posts
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <Link key={item.id} href={`/news/${item.slug}`} className="block group">
                <Card className="group-hover:border-primary/40 transition-colors">
                  <CardContent className="space-y-3">
                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                      <Badge variant="secondary">{TYPE_LABELS[item.type]}</Badge>
                      <time dateTime={item.publishedAt.toISOString()}>
                        {format(item.publishedAt, "MMMM d, yyyy")}
                      </time>
                    </div>
                    <h2 className="text-xl font-semibold group-hover:text-primary transition-colors">
                      {item.title}
                    </h2>
                    {item.excerpt && <p className="text-muted-foreground">{item.excerpt}</p>}
                    {item.author?.name && (
                      <p className="text-sm text-muted-foreground">By {item.author.name}</p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-10">
            {page > 1 ? (
              <Link
                href={pageHref(page - 1, type)}
                className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
              >
                ← Previous
              </Link>
            ) : (
              <span className="text-sm text-muted-foreground/50" aria-disabled="true">
                ← Previous
              </span>
            )}
            <span className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            {page < totalPages ? (
              <Link
                href={pageHref(page + 1, type)}
                className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
              >
                Next →
              </Link>
            ) : (
              <span className="text-sm text-muted-foreground/50" aria-disabled="true">
                Next →
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
