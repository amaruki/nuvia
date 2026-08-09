/**
 * Public chapters index (plan UI-29) — card list of ACTIVE chapters only.
 * Ring-0 read via listPublicChapters(); non-ACTIVE units never surface.
 */

import Link from "next/link";
import { ArrowRight, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logger } from "@/lib/logger";
import { listPublicChapters, type PublicChapterSummary } from "@/lib/services/chapter";

import { ChapterCard } from "./_components/chapter-card";

export const dynamic = "force-dynamic";

export default async function PublicChaptersPage() {
  let chapters: PublicChapterSummary[] = [];
  let loadFailed = false;
  try {
    chapters = await listPublicChapters();
  } catch (error) {
    logger.error("public chapters page: list failed", { error: String(error) });
    loadFailed = true;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-6">
        {/* Hero Section */}
        <div className="text-center py-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
            Our Chapters
          </h1>
          <p className="text-lg text-muted-foreground mb-4">
            Find your local chapter — leadership, meetings and contact details.
          </p>
          <p className="text-sm text-muted-foreground">
            Looking for a working group instead?{" "}
            <Link
              href="/committees"
              className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center"
            >
              Browse committees
              <ArrowRight className="h-3 w-3 ml-1" />
            </Link>
          </p>
        </div>

        {/* Results */}
        <div className="mb-6 text-muted-foreground">
          {loadFailed
            ? "Chapters unavailable"
            : `${chapters.length} chapter${chapters.length === 1 ? "" : "s"} found`}
        </div>

        {loadFailed ? (
          <div className="text-center py-16 border rounded-lg bg-card">
            <h3 className="text-lg font-medium mb-2">We couldn&apos;t load chapters right now</h3>
            <p className="text-muted-foreground">Please try again in a few minutes.</p>
          </div>
        ) : chapters.length === 0 ? (
          <div className="text-center py-16 border rounded-lg bg-card">
            <Building2 className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No active chapters yet</h3>
            <p className="text-muted-foreground">
              Check back soon — new chapters are being organized.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {chapters.map((item) => (
              <ChapterCard key={item.id} chapter={item} />
            ))}
          </div>
        )}

        {/* CTA Section */}
        <div className="text-center mt-16 py-12 bg-gradient-to-r from-primary/10 to-accent/60 border border-border rounded-xl">
          <h2 className="text-2xl font-bold mb-4">Interested in the working groups too?</h2>
          <p className="text-muted-foreground mb-6">
            Committees carry specific mandates between chapter meetings.
          </p>
          <Button asChild size="lg">
            <Link href="/committees">Browse committees</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
