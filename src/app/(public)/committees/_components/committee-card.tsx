import Link from "next/link";
import { ArrowRight, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { PublicCommitteeSummary } from "@/lib/services/committee";
import type { CommitteeType } from "@/types/committee";

export const COMMITTEE_TYPE_LABELS: Record<CommitteeType, string> = {
  executive: "Executive",
  functional: "Functional",
  special_interest: "Special Interest",
  ad_hoc: "Ad Hoc",
  standing: "Standing",
};

export function CommitteeCard({ committee }: { committee: PublicCommitteeSummary }) {
  return (
    <Card className="h-full hover:shadow-md transition-shadow">
      <CardContent className="p-6 flex flex-col h-full">
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="text-lg font-semibold">{committee.displayName}</h3>
          <Badge variant="secondary" className="shrink-0">
            {COMMITTEE_TYPE_LABELS[committee.type]}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground mb-4 line-clamp-3">{committee.purpose}</p>

        <div className="mt-auto text-sm text-muted-foreground">
          <div className="flex items-center">
            <Users className="h-4 w-4 mr-2 shrink-0" />
            {committee.memberCount} member{committee.memberCount === 1 ? "" : "s"}
          </div>
        </div>

        <Link
          href={`/committees/${committee.id}`}
          className="mt-4 inline-flex items-center text-blue-600 hover:underline text-sm font-medium"
        >
          View committee
          <ArrowRight className="h-4 w-4 ml-1" />
        </Link>
      </CardContent>
    </Card>
  );
}
