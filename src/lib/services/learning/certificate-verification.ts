/**
 * Public certificate verification queries (plan item UI-03, decision D2).
 *
 * The public verification route looks certificates up by the
 * verificationCode stored in the database at issue time — codes are never
 * fabricated client-side. The returned projection is public-safe: it carries
 * the owner's name as stored but never the student's email.
 */

import { eq } from "drizzle-orm";

import { db } from "@/db/client";
import { certificate } from "@/db/schema";
import { certificateStatusEnum } from "@/db/schema/learning";

/** Database status values for certificates ("ACTIVE" | "REVOKED"). */
type DbCertificateStatus = (typeof certificateStatusEnum.enumValues)[number];

/** Public-safe projection: everything a verifier may see, no email. */
export interface CertificateVerificationRecord {
  id: string;
  courseName: string;
  studentName: string;
  status: DbCertificateStatus;
  verificationCode: string;
  issuedAt: Date;
  expiryDate: Date | null;
  grade: string | null;
  instructorName: string | null;
}

/**
 * Looks up a certificate by its stored verification code.
 * Returns the public-safe record for ACTIVE and REVOKED certificates alike
 * (the route renders the status), or null when no certificate matches.
 */
export async function verifyCertificateByCode(
  verificationCode: string,
): Promise<CertificateVerificationRecord | null> {
  const code = verificationCode.trim();
  if (!code) return null;

  const rows = await db
    .select({
      id: certificate.id,
      courseName: certificate.courseName,
      studentName: certificate.studentName,
      status: certificate.status,
      verificationCode: certificate.verificationCode,
      issuedAt: certificate.issuedAt,
      expiryDate: certificate.expiryDate,
      grade: certificate.grade,
      instructorName: certificate.instructorName,
    })
    .from(certificate)
    .where(eq(certificate.verificationCode, code))
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  return {
    id: row.id,
    courseName: row.courseName,
    studentName: row.studentName,
    status: row.status,
    verificationCode: row.verificationCode,
    issuedAt: row.issuedAt,
    expiryDate: row.expiryDate,
    grade: row.grade,
    instructorName: row.instructorName,
  };
}
