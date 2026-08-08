import { asc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { company, jobCategory, jobType, location } from "@/db/schema";
import type { JobBoardMeta } from "@/types/jobs.types";

// ---------------------------------------------------------------------------
// Board metadata (reference tables)
// ---------------------------------------------------------------------------

export async function getJobBoardMeta(): Promise<JobBoardMeta> {
  const [categories, types, locations, companies] = await Promise.all([
    db
      .select({
        id: jobCategory.id,
        name: jobCategory.name,
        displayName: jobCategory.displayName,
        sortOrder: jobCategory.sortOrder,
      })
      .from(jobCategory)
      .where(eq(jobCategory.isActive, true))
      .orderBy(asc(jobCategory.sortOrder), asc(jobCategory.name)),
    db
      .select({ id: jobType.id, name: jobType.name, displayName: jobType.displayName })
      .from(jobType)
      .where(eq(jobType.isActive, true))
      .orderBy(asc(jobType.displayName)),
    db
      .select({
        id: location.id,
        name: location.name,
        displayName: location.displayName,
        remote: location.remote,
      })
      .from(location)
      .where(eq(location.isActive, true))
      .orderBy(asc(location.sortOrder), asc(location.name)),
    db
      .select({
        id: company.id,
        name: company.name,
        displayName: company.displayName,
        logo: company.logo,
      })
      .from(company)
      .where(eq(company.isActive, true))
      .orderBy(asc(company.displayName)),
  ]);

  return { categories, types, locations, companies };
}
