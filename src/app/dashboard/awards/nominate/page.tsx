/**
 * Member award nominations (backlog UI-36).
 *
 * Server component per ADR-0006: session-gated, calls the award service
 * directly. Members only ever see what they need to nominate: the ring-safe
 * projection of OPEN programs inside their nomination window, and their own
 * nominations. Nominee/nominator emails, statements, and review details of
 * other members' nominations are never surfaced here (ring-0 fields).
 */

import { redirect } from "next/navigation";
import { Award } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { getCurrentUser } from "@/lib/auth/utils/session";
import { listOpenAwardPrograms, listOwnNominations } from "@/lib/services/award";
import { formatDate } from "@/lib/utils/date-utils";
import { NominationForm } from "./_components/nomination-form";
import { NominatePageHeader } from "./_components/page-header";

export const dynamic = "force-dynamic";

const NOMINATION_STATUS_LABELS: Record<string, string> = {
  pending: "Pending review",
  under_review: "Under review",
  approved: "Approved",
  rejected: "Not selected",
};

const NOMINATION_STATUS_VARIANTS: Record<
  string,
  "default" | "secondary" | "outline" | "destructive"
> = {
  pending: "secondary",
  under_review: "outline",
  approved: "default",
  rejected: "destructive",
};

export default async function NominatePage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth/login");
  }

  const [openPrograms, ownNominations] = await Promise.all([
    listOpenAwardPrograms(),
    listOwnNominations(user.id),
  ]);

  return (
    <div className="space-y-8 animate-fadeInUp max-w-3xl">
      <NominatePageHeader />

      {openPrograms.length === 0 ? (
        <div className="text-center py-16 border rounded-lg bg-card">
          <Award className="h-12 w-12 mx-auto mb-3 text-foreground/30" />
          <h3 className="font-medium text-foreground/80 mb-1">
            No award programs are open for nominations right now
          </h3>
          <p className="text-sm text-muted-foreground">
            Nominations open when an award program enters its nomination window. Check back soon.
          </p>
        </div>
      ) : (
        <NominationForm programs={openPrograms} />
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Your nominations</h2>
        {ownNominations.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            You haven&apos;t submitted any nominations yet.
          </p>
        ) : (
          <ul className="space-y-3">
            {ownNominations.map((nomination) => (
              <li
                key={nomination.id}
                className="rounded-lg border bg-card p-4 flex items-start justify-between gap-4"
              >
                <div>
                  <p className="font-medium">{nomination.nomineeName}</p>
                  <p className="text-sm text-muted-foreground">
                    {nomination.programName} · submitted{" "}
                    {formatDate(nomination.createdAt, "MMM d, yyyy")}
                  </p>
                </div>
                <Badge variant={NOMINATION_STATUS_VARIANTS[nomination.status] ?? "secondary"}>
                  {NOMINATION_STATUS_LABELS[nomination.status] ?? nomination.status}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
