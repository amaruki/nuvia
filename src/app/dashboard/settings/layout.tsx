import { SettingsNav } from "./settings-nav";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

interface SettingsLayoutProps {
  children: React.ReactNode;
}

/**
 * Settings section shell. Deliberately reads nothing from the database so
 * the non-general settings stubs stay statically prerenderable; pages that
 * need the organization row read it themselves (and opt into force-dynamic).
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
