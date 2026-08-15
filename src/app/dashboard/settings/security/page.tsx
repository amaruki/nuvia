/**
 * UI-23 — settings/security: the signed-in user's account security.
 *
 * Server shell per ADR-0006 with client islands under _components/.
 * Everything here is self-service: each surface acts on the caller's own
 * account through the session cookie, so the shell needs no permission
 * gate beyond authentication (the proxy already enforces the nav-data
 * role list for /dashboard/settings/*).
 *
 * The active-devices and login-activities surfaces already exist as real
 * pages (/dashboard/active-devices, /dashboard/login-activities) — this
 * page links them instead of forking their data tables.
 */

import Link from "next/link";
import { ArrowRight, KeyRound, MonitorSmartphone, ScrollText, TriangleAlert } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/utils/session";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/dashboard/page-header";
import { ChangePasswordForm } from "./_components/change-password-form";
import { DeleteAccountDialog } from "./_components/delete-account-dialog";

// Reads the session user at request time; opting out of static
// prerendering keeps `next build` from needing a live database
// (same reasoning as settings/general).
export const dynamic = "force-dynamic";

const SECURITY_SURFACES = [
  {
    href: "/dashboard/active-devices",
    icon: MonitorSmartphone,
    title: "Active devices",
    description:
      "Every signed-in session on your account. Revoke a single device or sign out everywhere else.",
  },
  {
    href: "/dashboard/login-activities",
    icon: ScrollText,
    title: "Login activity",
    description:
      "Your sign-in history — time, location, device, and whether each attempt succeeded.",
  },
] as const;

export default async function SettingsSecurityPage() {
  const user = await getCurrentUser();

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader title="Security settings" />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5" />
            Change password
          </CardTitle>
          <CardDescription>
            Changing your password signs out your other devices automatically.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>

      <div>
        <h2 className="text-lg font-semibold">Devices &amp; activity</h2>
        <p className="text-sm text-muted-foreground">
          Review where your account is signed in and every recorded sign-in attempt.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {SECURITY_SURFACES.map((surface) => (
            <Link
              key={surface.href}
              href={surface.href}
              className="group rounded-lg border bg-card p-4 transition-colors hover:border-primary/50"
            >
              <surface.icon className="h-5 w-5 text-muted-foreground group-hover:text-foreground" />
              <p className="mt-2 flex items-center gap-1 font-medium">
                {surface.title}
                <ArrowRight className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{surface.description}</p>
            </Link>
          ))}
        </div>
      </div>

      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <TriangleAlert className="h-5 w-5" />
            Danger zone
          </CardTitle>
          <CardDescription>
            Permanently delete {user ? user.email : "your account"} and everything attached to it.
            This cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-4">
          <Badge variant="outline">Deletes sessions, login history, and linked sign-ins</Badge>
          {user && <DeleteAccountDialog email={user.email} />}
        </CardContent>
      </Card>
    </div>
  );
}
