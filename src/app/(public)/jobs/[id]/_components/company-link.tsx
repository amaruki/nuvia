/**
 * UI-30: company name on the public job detail, linked to the company's
 * website when the schema holds one. Companies without a website render as
 * plain text — the link is data-driven, never invented.
 */

import { eq } from "drizzle-orm";

import { db } from "@/db/client";
import { company } from "@/db/schema";

/** Website stored for the company, or null when absent/unknown. */
export async function getCompanyLinkTarget(companyId: string): Promise<string | null> {
  const [row] = await db
    .select({ website: company.website })
    .from(company)
    .where(eq(company.id, companyId))
    .limit(1);

  const website = row?.website?.trim();
  return website ? website : null;
}

interface CompanyNameLinkProps {
  companyId: string;
  name: string;
}

export async function CompanyNameLink({ companyId, name }: CompanyNameLinkProps) {
  const website = await getCompanyLinkTarget(companyId);

  if (!website) {
    return <span>{name}</span>;
  }

  return (
    <a
      href={website}
      target="_blank"
      rel="noopener noreferrer"
      className="hover:text-primary hover:underline"
      aria-label={`${name} website (opens in a new tab)`}
    >
      {name}
    </a>
  );
}
