import { and, count, desc, eq, ilike, or, type SQL } from "drizzle-orm";
import { db } from "@/db/client";
import { certificate } from "@/db/schema/learning";
import type { Certificate, CertificateStatus } from "@/types/learning.types";
import { toUiCertificate } from "./mappers";
import { UI_TO_DB_CERT_STATUS } from "./types";
import { paginate, type CertificateListFilters, type Paginated } from "./query-helpers";

// ---------------------------------------------------------------------------
// Certificates — list / read
// ---------------------------------------------------------------------------

function buildCertificateListWhere(filters: CertificateListFilters): SQL | undefined {
  const clauses: SQL[] = [];

  if (filters.status) {
    const dbStatus = UI_TO_DB_CERT_STATUS[filters.status as CertificateStatus];
    if (dbStatus) clauses.push(eq(certificate.status, dbStatus));
  }

  if (filters.courseId) {
    clauses.push(eq(certificate.courseId, filters.courseId));
  }

  if (filters.search && filters.search.trim().length > 0) {
    const term = `%${filters.search.trim()}%`;
    const searchClause = or(
      ilike(certificate.studentName, term),
      ilike(certificate.studentEmail, term),
      ilike(certificate.courseName, term),
      ilike(certificate.verificationCode, term),
    );
    if (searchClause) clauses.push(searchClause);
  }

  return clauses.length > 0 ? and(...clauses) : undefined;
}

export async function listCertificates(
  filters: CertificateListFilters = {},
): Promise<Paginated<Certificate>> {
  const { page, limit, offset } = paginate(filters.page, filters.limit);
  const where = buildCertificateListWhere(filters);

  const [{ total }] = await db.select({ total: count() }).from(certificate).where(where);

  const rows = await db
    .select()
    .from(certificate)
    .where(where)
    .orderBy(desc(certificate.issuedAt))
    .limit(limit)
    .offset(offset);

  return {
    items: rows.map(toUiCertificate),
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

export async function getCertificate(id: string): Promise<Certificate | null> {
  const rows = await db.select().from(certificate).where(eq(certificate.id, id)).limit(1);
  return rows.length > 0 ? toUiCertificate(rows[0]) : null;
}

// ---------------------------------------------------------------------------
// Member-scoped reads (front office, plan UI-03/D2)
// ---------------------------------------------------------------------------

/**
 * Lists the ACTIVE certificates belonging to one member, matched by the
 * studentEmail stored on the certificate (the session user's email).
 * Newest first; revoked certificates are excluded from the member list.
 */
export async function listCertificatesForStudent(studentEmail: string): Promise<Certificate[]> {
  const rows = await db
    .select()
    .from(certificate)
    .where(and(eq(certificate.studentEmail, studentEmail), eq(certificate.status, "ACTIVE")))
    .orderBy(desc(certificate.issuedAt));

  return rows.map(toUiCertificate);
}

/**
 * Fetches one certificate for its owner only. Returns null when the
 * certificate does not exist or belongs to a different studentEmail, so a
 * member can never read another member's certificate through this path.
 */
export async function getCertificateForStudent(
  certificateId: string,
  studentEmail: string,
): Promise<Certificate | null> {
  const rows = await db
    .select()
    .from(certificate)
    .where(and(eq(certificate.id, certificateId), eq(certificate.studentEmail, studentEmail)))
    .limit(1);

  const row = rows[0];
  return row ? toUiCertificate(row) : null;
}
