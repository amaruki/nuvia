import Link from "next/link";
import { format } from "date-fns";
import { MessagesSquare } from "lucide-react";
import { getCurrentUser } from "@/lib/rbac";
import {
  listPublicForumCategories,
  type ForumReader,
  type PublicForumCategory,
} from "@/lib/services/forum";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Public forum category index (UI-27).
 *
 * Reads go straight to the service layer — the audience gate (D8: members
 * only by default, anonymous readers see only admin-opened categories)
 * lives in public-reads, and nothing below moderation status PUBLISHED is
 * ever counted or listed here.
 */

function CategoryCard({ category }: { category: PublicForumCategory }) {
  return (
    <Link href={`/forums/${category.name}`} className="block group h-full">
      <Card className="group-hover:border-primary/40 transition-colors h-full">
        <CardContent className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10"
              style={category.color ? { backgroundColor: `${category.color}1f` } : undefined}
            >
              <MessagesSquare
                className="h-5 w-5 text-primary"
                style={category.color ? { color: category.color } : undefined}
              />
            </div>
            <span className="text-sm text-muted-foreground">
              {category.postCount} thread{category.postCount === 1 ? "" : "s"}
            </span>
          </div>
          <div>
            <h2 className="font-semibold group-hover:text-primary transition-colors">
              {category.displayName}
            </h2>
            {category.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {category.description}
              </p>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {category.lastPostAt
              ? `Last activity ${format(category.lastPostAt, "MMM d, yyyy")}`
              : "No threads yet"}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}

export default async function PublicForumsPage() {
  const currentUser = await getCurrentUser();
  const reader: ForumReader = currentUser ? { role: currentUser.role } : null;

  const categories = await listPublicForumCategories(reader);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-6">
        {/* Hero */}
        <div className="text-center py-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
            Community Forums
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            Discussions, questions, and resources from our members.
          </p>
        </div>

        {categories.length === 0 ? (
          <div className="text-center py-16 border rounded-lg bg-card">
            <MessagesSquare className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No forum categories are open yet</h3>
            <p className="text-muted-foreground">
              {reader
                ? "When the community team opens discussion categories, they will appear here."
                : "Sign in to browse member-only categories, or check back when public categories open."}
            </p>
            {!reader && (
              <Link
                href="/auth/login?redirectTo=/forums"
                className="inline-block mt-4 text-blue-600 dark:text-blue-400 hover:underline"
              >
                Sign in
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categories.map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
