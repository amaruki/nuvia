/**
 * Member certificate detail (plan item UI-03, decision D2).
 *
 * Session-gated server component. Ownership is enforced in the query:
 * getCertificateForStudent only returns a certificate whose studentEmail
 * matches the signed-in member's email; anything else is a 404. Revoked
 * certificates of the owner are shown honestly with their status.
 */

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Award, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { getCurrentUser } from "@/lib/auth/utils/session";
import { getCertificateForStudent } from "@/lib/services/learning/certificate-queries";
import { formatDate } from "@/lib/utils/date-utils";

export const dynamic = "force-dynamic";

interface CertificateDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function CertificateDetailPage({ params }: CertificateDetailPageProps) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth/login");
  }

  const { id } = await params;
  const certificate = await getCertificateForStudent(id, user.email);
  if (!certificate) {
    notFound();
  }

  const isActive = certificate.status === "active";
  const verificationUrl = `/certificates/verify/${certificate.verificationCode}`;

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <Link
        href="/certificates"
        className="inline-flex items-center text-sm text-foreground/60 hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to my certificates
      </Link>

      <div className="border rounded-xl bg-card p-8 sm:p-10">
        <div className="flex items-start justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <Award className="h-10 w-10 text-primary" />
            <div>
              <h1 className="text-xl font-bold text-foreground/90">{certificate.courseName}</h1>
              <p className="text-sm text-foreground/60">Certificate of Completion</p>
            </div>
          </div>
          <Badge
            className={
              isActive ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"
            }
          >
            {isActive ? "Active" : "Revoked"}
          </Badge>
        </div>

        {!isActive && (
          <div className="mb-6 border border-destructive/40 bg-destructive/10 rounded-lg p-4 text-sm text-destructive">
            This certificate has been revoked and is no longer valid. It will be reported as revoked
            to anyone verifying the code.
          </div>
        )}

        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <DetailRow label="Certificate holder" value={certificate.studentName} />
          <DetailRow label="Course" value={certificate.courseName} />
          <DetailRow label="Issued" value={formatDate(certificate.issueDate, "MMM d, yyyy")} />
          {certificate.expiryDate && (
            <DetailRow label="Expires" value={formatDate(certificate.expiryDate, "MMM d, yyyy")} />
          )}
          {certificate.instructorName && (
            <DetailRow label="Instructor" value={certificate.instructorName} />
          )}
          {certificate.grade && <DetailRow label="Grade" value={certificate.grade} />}
        </dl>

        <div className="mt-8 border-t pt-6">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="h-4 w-4 text-foreground/60" />
            <h2 className="text-sm font-semibold text-foreground/80">Verification</h2>
          </div>
          <p className="text-sm text-foreground/60 mb-3">
            Share this code so others can confirm this certificate is genuine:
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <code className="font-mono text-sm bg-muted px-3 py-2 rounded-md">
              {certificate.verificationCode}
            </code>
            <Link
              href={verificationUrl}
              className="text-sm text-primary hover:underline"
              target="_blank"
            >
              Open public verification page
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="border rounded-md p-3">
      <dt className="text-foreground/50 mb-1">{label}</dt>
      <dd className="font-medium text-foreground/90">{value}</dd>
    </div>
  );
}
