/**
 * Public certificate verification (plan item UI-03, decision D2).
 *
 * Looks the certificate up by the verificationCode stored in the database at
 * issue time — codes are never generated or guessed client-side. The page is
 * fully public (no session) and shows a public-safe projection: the owner's
 * name and certificate details, never the owner's email.
 */

import type { ReactNode } from "react";
import { CheckCircle2, HelpCircle, XCircle } from "lucide-react";

import {
  verifyCertificateByCode,
  type CertificateVerificationRecord,
} from "@/lib/services/learning/certificate-verification";
import { formatDate } from "@/lib/utils/date-utils";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export const dynamic = "force-dynamic";

interface VerifyCertificatePageProps {
  params: Promise<{ code: string }>;
}

export default async function VerifyCertificatePage({ params }: VerifyCertificatePageProps) {
  const { code } = await params;
  const record = await verifyCertificateByCode(decodeURIComponent(code));

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <h1 className="text-2xl font-bold text-foreground/90 mb-2">Certificate Verification</h1>
      <p className="text-sm text-foreground/60 mb-8">
        Checking code <span className="font-mono font-medium">{code}</span>
      </p>

      {!record ? (
        <div className="border rounded-lg p-8 text-center bg-card">
          <HelpCircle className="h-12 w-12 mx-auto mb-3 text-foreground/40" />
          <h2 className="text-lg font-semibold text-foreground/80 mb-1">Certificate not found</h2>
          <p className="text-sm text-foreground/60">
            No certificate matches this verification code. Check the code for typos, or ask the
            certificate holder for the exact code printed on their certificate.
          </p>
        </div>
      ) : record.status === "REVOKED" ? (
        <VerificationCard
          icon={<XCircle className="h-12 w-12 mx-auto mb-3 text-destructive" />}
          title="Certificate revoked"
          titleClassName="text-destructive"
          description="This certificate was issued but has since been revoked and is no longer valid."
          record={record}
          borderClassName="border-destructive/40"
        />
      ) : (
        <VerificationCard
          icon={<CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-success" />}
          title="Certificate verified"
          titleClassName="text-success"
          description="This certificate is valid and was issued by Nuvia."
          record={record}
          borderClassName="border-success/40"
        />
      )}
    </div>
  );
}

interface VerificationCardProps {
  icon: ReactNode;
  title: string;
  titleClassName: string;
  description: string;
  borderClassName: string;
  record: CertificateVerificationRecord;
}

function VerificationCard({
  icon,
  title,
  titleClassName,
  description,
  borderClassName,
  record,
}: VerificationCardProps) {
  return (
    <div className={`border rounded-lg p-8 bg-card ${borderClassName}`}>
      <div className="text-center mb-6">
        {icon}
        <h2 className={`text-lg font-semibold ${titleClassName}`}>{title}</h2>
        <p className="text-sm text-foreground/60 mt-1">{description}</p>
      </div>

      {/* Public-safe projection: owner name as stored, never the email. */}
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
        <DetailRow label="Certificate holder" value={record.studentName} />
        <DetailRow label="Course" value={record.courseName} />
        <DetailRow label="Issued" value={formatDate(record.issuedAt, "MMM d, yyyy")} />
        <DetailRow label="Verification code" value={record.verificationCode} mono />
        {record.instructorName && <DetailRow label="Instructor" value={record.instructorName} />}
        {record.grade && <DetailRow label="Grade" value={record.grade} />}
        {record.expiryDate && (
          <DetailRow label="Expires" value={formatDate(record.expiryDate, "MMM d, yyyy")} />
        )}
      </dl>
    </div>
  );
}

function DetailRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="border rounded-md p-3">
      <dt className="text-foreground/50 mb-1">{label}</dt>
      <dd className={mono ? "font-mono text-foreground/90" : "font-medium text-foreground/90"}>
        {value}
      </dd>
    </div>
  );
}
