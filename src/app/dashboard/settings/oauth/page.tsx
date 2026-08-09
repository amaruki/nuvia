/**
 * UI-23 — settings/oauth: connected sign-in providers for this deployment.
 *
 * Server shell per ADR-0006. Honesty rules baked in: only Google can be a
 * social provider here (src/lib/auth/core.ts — GitHub/LinkedIn are not wired up),
 * the Google provider itself only activates when its env credentials exist,
 * and no connect button is rendered for an unconfigured provider.
 */

import Link from "next/link";
import { CheckCircle2, Link2, Unlink, UserRound } from "lucide-react";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { account } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/utils/session";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { LinkGoogleButton } from "./_components/link-google-button";

// Reads the session user and their linked accounts at request time.
export const dynamic = "force-dynamic";

const PROVIDER_LABELS: Record<string, string> = {
  credential: "Email & password",
  google: "Google",
  github: "GitHub",
  linkedin: "LinkedIn",
};

export default async function SettingsOAuthPage() {
  const user = await getCurrentUser();

  // Same activation test src/lib/auth/core.ts applies to socialProviders.google.
  const googleConfigured = Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
  );

  const accounts = user
    ? await db
        .select({ providerId: account.providerId, createdAt: account.createdAt })
        .from(account)
        .where(eq(account.userId, user.id))
    : [];

  const linkedProviders = new Set(accounts.map((row) => row.providerId));

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">OAuth settings</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Your sign-in methods
          </CardTitle>
          <CardDescription>
            How {user ? user.email : "your account"} can currently sign in.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {linkedProviders.size === 0 && (
            <p className="text-sm text-muted-foreground">
              No sign-in methods are recorded for this account yet.
            </p>
          )}
          {accounts.map((row) => (
            <div key={row.providerId} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span className="text-sm font-medium">
                  {PROVIDER_LABELS[row.providerId] ?? row.providerId}
                </span>
              </div>
              <span className="text-xs text-muted-foreground">
                {row.createdAt
                  ? `${row.providerId === "google" ? "Linked" : "Enabled"} ${new Date(
                      row.createdAt,
                    ).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      timeZone: "UTC",
                    })}`
                  : ""}
              </span>
            </div>
          ))}
          <Separator />
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <UserRound className="h-4 w-4" />
            Display name and avatar are managed on your{" "}
            <Link href="/dashboard/profile" className="underline underline-offset-2">
              profile page
            </Link>
            , not here.
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Unlink className="h-5 w-5" />
            Providers on this deployment
          </CardTitle>
          <CardDescription>
            Which social providers exist in this build — configured providers are activated with
            deployment environment variables (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Google</p>
              <p className="text-sm text-muted-foreground">
                {googleConfigured
                  ? "Configured with OAuth credentials."
                  : "Credentials are not configured (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET missing), so Google sign-in is inactive."}
              </p>
            </div>
            {googleConfigured ? (
              <Badge>Configured</Badge>
            ) : (
              <Badge variant="secondary">Not configured</Badge>
            )}
          </div>

          {googleConfigured && !linkedProviders.has("google") && <LinkGoogleButton />}

          <Separator />
          <div className="space-y-3">
            {(["github", "linkedin"] as const).map((provider) => (
              <div key={provider} className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">{PROVIDER_LABELS[provider]}</p>
                  <p className="text-sm text-muted-foreground">
                    Not implemented in this build yet (no OAuth wiring exists in
                    src/lib/auth/core.ts).
                  </p>
                </div>
                <Badge variant="outline">Planned</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
