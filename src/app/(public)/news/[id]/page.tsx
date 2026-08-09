import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { getPublicNewsItem, type NewsType } from "@/lib/services/content/public-news";
import { Badge } from "@/components/ui/badge";

const TYPE_LABELS: Record<NewsType, string> = {
  ARTICLE: "Article",
  ANNOUNCEMENT: "Announcement",
  PUBLICATION: "Publication",
};

export default async function PublicNewsDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await getPublicNewsItem(id);

  if (!item) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Post not found</h1>
          <p className="text-muted-foreground mb-6">
            The post you&apos;re looking for doesn&apos;t exist or is no longer published.
          </p>
          <Link href="/news" className="text-blue-600 dark:text-blue-400 hover:underline">
            Back to News
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/news"
            className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to News
          </Link>

          <div className="flex flex-wrap items-center gap-3 mb-4">
            <Badge variant="secondary">{TYPE_LABELS[item.type]}</Badge>
            <time
              dateTime={item.publishedAt.toISOString()}
              className="text-sm text-muted-foreground"
            >
              {format(item.publishedAt, "MMMM d, yyyy")}
            </time>
          </div>

          <h1 className="text-4xl font-bold mb-4">{item.title}</h1>

          {/* Byline: content.authorId (schema: notNull FK to users.id) resolves
              through the public projection's author fragment. The name links to
              the member profile (UI-28); when no author resolves there is
              nothing honest to show, so the byline is omitted. */}
          {item.author?.name && (
            <p className="text-muted-foreground">
              By{" "}
              {item.author.id ? (
                <Link
                  href={`/members/${item.author.id}`}
                  className="font-medium text-foreground hover:underline"
                >
                  {item.author.name}
                </Link>
              ) : (
                <span className="font-medium text-foreground">{item.author.name}</span>
              )}
            </p>
          )}
        </div>

        {/* Reading view */}
        <article className="prose prose-lg max-w-none">
          <p className="whitespace-pre-wrap leading-relaxed text-foreground/90">{item.content}</p>
        </article>

        {item.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-10 pt-6 border-t">
            {item.tags.map((tag) => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
