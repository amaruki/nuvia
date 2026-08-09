/**
 * Dashboard surface for the viewer's own ACTIVE certificates (UI-23).
 *
 * Reads through the D2 member-scoped query (listCertificatesForStudent),
 * which matches certificates by the session user's email and excludes revoked
 * rows — so this page can never show another member's certificate. Verify
 * links point at the public verification route.
 */

import Link from "next/link";
import { redirect } from "next/navigation";
import { Award, ExternalLink, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { isRoleAllowedForPath } from "@/lib/dashboard-access";
import { getCurrentUser } from "@/lib/rbac";
import { listCertificatesForStudent } from "@/lib/services/learning/certificate-queries";

export const dynamic = "force-dynamic";

const PATH = "/dashboard/events/certificates";

export default async function EventsCertificatesPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/auth/login");

  if (!isRoleAllowedForPath(PATH, currentUser.role)) {
    return (
      <div className="space-y-6 p-6 md:p-8">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">Event Certificates</h1>
        </header>
        <Card>
          <EmptyState
            icon={<ShieldCheck className="size-8 text-muted-foreground" aria-hidden="true" />}
            title="You don't have access to this page"
            description="Your current role isn't permitted to view event certificates. Contact an administrator if you believe this is a mistake."
          />
        </Card>
      </div>
    );
  }

  const certificates = await listCertificatesForStudent(currentUser.email);

  return (
    <div className="space-y-6 p-6 md:p-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Event Certificates</h1>
        <p className="text-muted-foreground text-sm">
          Active certificates issued to {currentUser.email}. Each one links to its public
          verification page.
        </p>
      </header>

      {certificates.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Award className="size-8 text-muted-foreground" aria-hidden="true" />}
            title="No certificates yet"
            description="Certificates appear here once a course or event you completed issues one to your email address."
          />
        </Card>
      ) : (
        <div className="grid gap-4">
          {certificates.map((certificate) => (
            <Card key={certificate.id}>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle className="text-base">{certificate.courseName}</CardTitle>
                  <Badge variant="success">Active</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <dl className="text-muted-foreground grid gap-x-6 gap-y-1 text-sm sm:grid-cols-3">
                  <div>
                    <dt className="text-xs uppercase tracking-wide">Issued</dt>
                    <dd className="text-foreground">{certificate.issueDate}</dd>
                  </div>
                  {certificate.grade ? (
                    <div>
                      <dt className="text-xs uppercase tracking-wide">Grade</dt>
                      <dd className="text-foreground">{certificate.grade}</dd>
                    </div>
                  ) : null}
                  {certificate.instructorName ? (
                    <div>
                      <dt className="text-xs uppercase tracking-wide">Instructor</dt>
                      <dd className="text-foreground">{certificate.instructorName}</dd>
                    </div>
                  ) : null}
                </dl>
                <div className="flex flex-wrap gap-3">
                  <Link
                    href={`/certificates/${certificate.id}`}
                    className="text-primary text-sm font-medium underline-offset-4 hover:underline"
                  >
                    View certificate
                  </Link>
                  <Link
                    href={`/certificates/verify/${certificate.verificationCode}`}
                    className="text-primary inline-flex items-center gap-1 text-sm font-medium underline-offset-4 hover:underline"
                  >
                    Verify <ExternalLink className="size-3.5" aria-hidden="true" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
