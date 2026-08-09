import { hasPermission } from "@/lib/rbac";
import { getOrganization } from "@/lib/services/organization.service";
import { OrganizationSettingsForm } from "./organization-settings-form";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

// The organization row is read from the database at request time; opting out
// of static prerendering keeps `next build` from needing a live database.
export const dynamic = "force-dynamic";

export default async function SettingsGeneralPage() {
  const [organization, canEdit] = await Promise.all([
    getOrganization(),
    hasPermission("organization:update"),
  ]);

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">General settings</h1>
      <div>
        <h2 className="text-lg font-semibold">Organization</h2>
        <p className="text-sm text-muted-foreground">
          Identity, branding, locale, and currency for {organization.name}. These values feed email
          templates, currency formatting, and dashboard branding.
        </p>
      </div>

      <OrganizationSettingsForm
        organization={{
          name: organization.name,
          legalName: organization.legalName,
          logo: organization.logo,
          website: organization.website,
          supportEmail: organization.supportEmail,
          locale: organization.locale,
          currency: organization.currency,
          timezone: organization.timezone,
        }}
        canEdit={canEdit}
      />
    </div>
  );
}
