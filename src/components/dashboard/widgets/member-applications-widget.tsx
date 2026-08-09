/**
 * UI-31 — My job applications widget (member home).
 *
 * Lists the caller's job applications — the same data GET
 * /api/v1/jobs/applications/mine serves — with the job title, current
 * status, and applied date, each linking to the job posting. Purely
 * presentational; the list is read-only here.
 *
 * Server component.
 */

import Link from "next/link";
import { Briefcase } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import type { JobApplicationDto } from "@/types/jobs.types";
import { APPLICATION_STATUS_LABELS } from "@/types/jobs.types";
import { formatDate } from "@/lib/utils/date-utils";

interface MemberApplicationsWidgetProps {
  applications: JobApplicationDto[];
}

export function MemberApplicationsWidget({ applications }: MemberApplicationsWidgetProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Briefcase className="h-5 w-5 text-muted-foreground" aria-hidden />
          My job applications
        </CardTitle>
        <CardDescription>Roles you have applied for</CardDescription>
      </CardHeader>
      <CardContent>
        {applications.length === 0 ? (
          <EmptyState
            title="No applications yet"
            description="When you apply for a job it will appear here."
            icon={<Briefcase className="h-8 w-8 text-muted-foreground" />}
          />
        ) : (
          <ul className="space-y-3">
            {applications.map((application) => (
              <li
                key={application.id}
                className="flex flex-col gap-2 rounded-md border p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="space-y-1">
                  <Link
                    href={`/jobs/${application.jobId}`}
                    className="font-medium underline-offset-4 hover:underline"
                  >
                    {application.jobTitle ?? "Job application"}
                  </Link>
                  <p className="text-sm text-muted-foreground">
                    Applied {formatDate(application.appliedAt, "MMM d, yyyy")}
                  </p>
                </div>
                <Badge variant="outline">{APPLICATION_STATUS_LABELS[application.status]}</Badge>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
