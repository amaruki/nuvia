/**
 * Member certificate list (plan item UI-03, decision D2).
 *
 * Session-gated server component: shows only the ACTIVE certificates whose
 * studentEmail matches the signed-in member. Data comes from the learning
 * service (drizzle direct), never from a mock or a hardcoded user-id lookup.
 */

import Link from "next/link";
import { redirect } from "next/navigation";
import { Award, ExternalLink } from "lucide-react";

import { EventListLayout } from "@/components/events/event-list-layout";
import { Badge } from "@/components/ui/badge";
import { getCurrentUser } from "@/lib/auth/utils/session";
import { listCertificatesForStudent } from "@/lib/services/learning/certificate-queries";
import { formatDate } from "@/lib/utils/date-utils";

export const dynamic = "force-dynamic";

export default async function MyCertificatesPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth/login");
  }

  const certificates = await listCertificatesForStudent(user.email);

  return (
    <EventListLayout
      title="My Certificates"
      description="Certificates issued for learning you have completed"
      icon={<Award className="h-8 w-8 text-primary" />}
      backUrl="/events"
    >
      {certificates.length === 0 ? (
        <div className="text-center py-16 border rounded-lg bg-card">
          <Award className="h-12 w-12 mx-auto mb-3 text-foreground/30" />
          <h3 className="font-medium text-foreground/80 mb-1">No certificates yet</h3>
          <p className="text-sm text-foreground/50">
            Certificates issued for courses you complete will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {certificates.map((certificate) => (
            <Link
              key={certificate.id}
              href={`/certificates/${certificate.id}`}
              className="block p-5 border rounded-lg bg-card hover:border-primary/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-foreground/90">{certificate.courseName}</h3>
                  <p className="text-sm text-foreground/60 mt-1">
                    Issued {formatDate(certificate.issueDate, "MMM d, yyyy")}
                    {certificate.instructorName ? ` · ${certificate.instructorName}` : ""}
                  </p>
                  {certificate.grade && (
                    <p className="text-sm text-foreground/60 mt-1">Grade: {certificate.grade}</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge className="bg-success/15 text-success">Active</Badge>
                  <span className="text-xs text-foreground/50 flex items-center gap-1">
                    View details
                    <ExternalLink className="h-3 w-3" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="mt-10 bg-info/10 border border-info/30 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-info mb-2">Verifying a certificate</h3>
        <p className="text-sm text-info">
          Every certificate carries a verification code. Anyone can confirm it at{" "}
          <span className="font-medium">/certificates/verify/&lt;code&gt;</span> — the lookup uses
          the code stored when the certificate was issued.
        </p>
      </div>
    </EventListLayout>
  );
}
