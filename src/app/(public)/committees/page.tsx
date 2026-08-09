/**
 * Public committees index (plan UI-29) — card list of ACTIVE committees only.
 * Ring-0 read via listPublicCommittees(); committees store their lifecycle
 * state as lowercase text, and only "active" is audience-ready (see
 * src/lib/services/committee/public.ts for the documented mapping).
 */

import Link from "next/link";
import { ArrowRight, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logger } from "@/lib/logger";
import { listPublicCommittees, type PublicCommitteeSummary } from "@/lib/services/committee";

import { CommitteeCard } from "./_components/committee-card";

export const dynamic = "force-dynamic";

export default async function PublicCommitteesPage() {
  let committees: PublicCommitteeSummary[] = [];
  let loadFailed = false;
  try {
    committees = await listPublicCommittees();
  } catch (error) {
    logger.error("public committees page: list failed", { error: String(error) });
    loadFailed = true;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-6">
        {/* Hero Section */}
        <div className="text-center py-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Our Committees
          </h1>
          <p className="text-lg text-muted-foreground mb-4">
            Working groups carrying specific mandates — leadership, purpose and contact details.
          </p>
          <p className="text-sm text-muted-foreground">
            Looking for a local chapter instead?{" "}
            <Link
              href="/chapters"
              className="text-blue-600 hover:underline inline-flex items-center"
            >
              Browse chapters
              <ArrowRight className="h-3 w-3 ml-1" />
            </Link>
          </p>
        </div>

        {/* Results */}
        <div className="mb-6 text-muted-foreground">
          {loadFailed
            ? "Committees unavailable"
            : `${committees.length} committee${committees.length === 1 ? "" : "s"} found`}
        </div>

        {loadFailed ? (
          <div className="text-center py-16 border rounded-lg bg-card">
            <h3 className="text-lg font-medium mb-2">We couldn&apos;t load committees right now</h3>
            <p className="text-muted-foreground">Please try again in a few minutes.</p>
          </div>
        ) : committees.length === 0 ? (
          <div className="text-center py-16 border rounded-lg bg-card">
            <Users className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No active committees yet</h3>
            <p className="text-muted-foreground">
              Check back soon — new committees are being organized.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {committees.map((item) => (
              <CommitteeCard key={item.id} committee={item} />
            ))}
          </div>
        )}

        {/* CTA Section */}
        <div className="text-center mt-16 py-12 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
          <h2 className="text-2xl font-bold mb-4">Interested in local chapters too?</h2>
          <p className="text-muted-foreground mb-6">
            Chapters organize members by region with their own leadership and meetings.
          </p>
          <Button asChild size="lg">
            <Link href="/chapters">Browse chapters</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
