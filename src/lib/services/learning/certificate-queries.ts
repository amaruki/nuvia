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
