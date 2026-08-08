import { SettingsNav } from "./settings-nav";

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
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Configure the organization running this deployment.
        </p>
      </div>
      <SettingsNav />
      {children}
    </div>
  );
}
