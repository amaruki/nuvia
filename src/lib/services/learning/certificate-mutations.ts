import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { certificate, course } from "@/db/schema/learning";
import { problems } from "@/lib/http";
import type { Certificate } from "@/types/learning.types";
import { getCertificate } from "./certificate-queries";
import { LearningServiceError, pgErrorCode, UNIQUE_VIOLATION } from "./errors";
import { toUiCertificate } from "./mappers";
import type { IssueCertificateInput, UpdateCertificateInput } from "./schemas";
import { UI_TO_DB_CERT_STATUS, type CertificateRow } from "./types";

// ---------------------------------------------------------------------------
// Certificates — write
// ---------------------------------------------------------------------------

/** "Advanced React Patterns" → "ADVA-REAC-2026-4821"-style verification code. */
function buildVerificationCode(courseTitle: string, now: Date): string {
  const slug =
    courseTitle
      .split(/\s+/)
      .slice(0, 2)
      .map((word) =>
        word
          .replace(/[^a-zA-Z]/g, "")
          .slice(0, 4)
          .toUpperCase(),
      )
      .filter(Boolean)
      .join("-") || "COURSE";
  const random = Math.floor(1000 + Math.random() * 9000);
  return `${slug}-${now.getFullYear()}-${random}`;
}

export async function issueCertificate(
  input: IssueCertificateInput,
  actor: string,
): Promise<Certificate> {
  const courseRows = await db.select().from(course).where(eq(course.id, input.courseId)).limit(1);
  if (courseRows.length === 0) {
    throw new LearningServiceError(
      problems.businessLogicError("Cannot issue a certificate for an unknown course"),
    );
  }
  const issuingFor = courseRows[0];

  const now = new Date();
  let row: CertificateRow | undefined;
  for (let attempt = 0; attempt < 3 && !row; attempt += 1) {
    try {
      [row] = await db
        .insert(certificate)
        .values({
          courseId: issuingFor.id,
          courseName: issuingFor.title,
          studentName: input.studentName,
          studentEmail: input.studentEmail,
          instructorName: issuingFor.instructorName,
          instructorSignature: issuingFor.instructorSignature,
          verificationCode: buildVerificationCode(issuingFor.title, now),
          ...(input.grade !== undefined ? { grade: input.grade } : {}),
          image: issuingFor.image,
          ...(input.expiryDate !== undefined ? { expiryDate: new Date(input.expiryDate) } : {}),
          issuedBy: actor,
        })
        .returning();
    } catch (error) {
      if (pgErrorCode(error) === UNIQUE_VIOLATION) continue; // code collision — retry
      throw error;
    }
  }
  if (!row) {
    throw new LearningServiceError(
      problems.conflict("Could not allocate a unique verification code"),
    );
  }
  return toUiCertificate(row);
}

export async function updateCertificate(
  id: string,
  input: UpdateCertificateInput,
): Promise<Certificate> {
  const existing = await db.select().from(certificate).where(eq(certificate.id, id)).limit(1);
  if (existing.length === 0) {
    throw new LearningServiceError(problems.notFound("Certificate not found"));
  }

  const target = UI_TO_DB_CERT_STATUS[input.status];
  if (existing[0].status !== target) {
    await db.update(certificate).set({ status: target }).where(eq(certificate.id, id));
  }

  const updated = await getCertificate(id);
  if (!updated) {
    throw new LearningServiceError(problems.notFound("Certificate not found"));
  }
  return updated;
}
