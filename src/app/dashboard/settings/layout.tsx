import { SettingsNav } from "./settings-nav";

interface SettingsLayoutProps {
  children: React.ReactNode;
}

/**
 * Settings section shell. Deliberately reads nothing from the database;
 * each sub-page reads its own data (session, organization, invoices) and
 * opts into force-dynamic itself, so the shell stays statically prerenderable.
 */
export default function SettingsLayout({ children }: SettingsLayoutProps) {
  return (
    <div className="space-y-6">
      <div>
        {/* UI-08: demoted from h1 — each settings sub-page owns the page's
            single h1; an h1 here would duplicate it on every tab. */}
        <p className="text-2xl font-semibold tracking-tight">Settings</p>
        <p className="text-sm text-muted-foreground">
          Configure the organization running this deployment.
        </p>
      </div>
      <SettingsNav />
      {children}
    </div>
  );
}
