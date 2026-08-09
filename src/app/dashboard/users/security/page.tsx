/**
 * UI-23 — users/security: the admin's view of user-account security.
 *
 * Server shell per ADR-0006. Honesty first: the backend has NO admin-scoped
 * security surface — /api/v1/auth/login-activities and
 * /api/v1/auth/active-devices are strictly scoped to the caller's own
 * account, and there is no endpoint to list or revoke another user's
 * sessions. So this page says exactly what admins can and cannot do, and
 * links the real surfaces instead of faking admin controls.
 */

import Link from "next/link";
import {
  ArrowRight,
  FolderKanban,
  KeyRound,
  MonitorSmartphone,
  ScrollText,
  ShieldAlert,
  Users,
} from "lucide-react";
import { hasPermission } from "@/lib/rbac";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

const ADMIN_SURFACES = [
  {
    href: "/dashboard/users/directory",
    icon: Users,
    title: "User directory",
    description: "Look up members, confirm their roles and membership status.",
  },
  {
    href: "/dashboard/users/roles",
    icon: FolderKanban,
    title: "Roles & permissions",
    description:
      "The real security lever admins hold: change what a user can access by editing their role.",
  },
  {
    href: "/dashboard/settings/security",
    icon: KeyRound,
    title: "Your own security",
    description: "Your password, signed-in devices, and account deletion.",
  },
  {
    href: "/dashboard/login-activities",
    icon: ScrollText,
    title: "Your login activity",
    description: "Login history is self-service: you can review only your own.",
  },
] as const;

export default async function UsersSecurityPage() {
  const canManageUsers = await hasPermission("users:manage");

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">User security</h1>

      {!canManageUsers && (
        <Card className="border-destructive/40">
          <CardContent className="flex items-start gap-3 pt-6">
            <ShieldAlert className="mt-0.5 h-5 w-5 text-destructive" />
            <p className="text-sm text-muted-foreground">
              Your role does not include user management (users:manage). The surfaces below are
              listed for reference.
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MonitorSmartphone className="h-5 w-5" />
            What admins can and cannot do
          </CardTitle>
          <CardDescription>
            Account security in this system is self-service by design.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Per-user only</Badge>
              <p className="text-muted-foreground">
                Login activity and active devices are scoped to the signed-in user — the API exposes
                no parameter to inspect another member&apos;s sessions or sign-in history.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Not built</Badge>
              <p className="text-muted-foreground">
                Admin session revocation for another user does not exist yet. A member revokes their
                own devices from their security settings.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Not built</Badge>
              <p className="text-muted-foreground">
                Multi-factor authentication is not implemented in this deployment yet.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge>Available</Badge>
              <p className="text-muted-foreground">
                Access control: grant or remove capabilities by assigning roles in Roles &amp;
                permissions.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-lg font-semibold">Related surfaces</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {ADMIN_SURFACES.map((surface) => (
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
    </div>
  );
}
