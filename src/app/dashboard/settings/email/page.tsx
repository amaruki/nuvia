/**
 * UI-23 — settings/email: the honest picture of email on this deployment.
 *
 * Server shell per ADR-0006. There is no per-user email-preferences store
 * in the backend (no schema table, no API route — the toggles on
 * /dashboard/preferences are disabled placeholders), so this page says so
 * plainly instead of inventing fake toggles. What IS real: transactional
 * email delivery, which is deployment-configured via environment variables
 * and branded with the organization below.
 */

import { Mail, MailCheck, MailX, Send } from "lucide-react";
import { env } from "@/lib/env";
import { getOrganization } from "@/lib/services/organization.service";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/dashboard/page-header";

// Reads the organization at request time; opting out of static
// prerendering keeps `next build` from needing a live database.
export const dynamic = "force-dynamic";

interface EmailCapability {
  label: string;
  detail: string;
}

const TRANSACTIONAL_EMAILS: EmailCapability[] = [
  {
    label: "Password reset",
    detail: "Sent when a user requests a reset link from the sign-in page.",
  },
  {
    label: "Email verification",
    detail: env.FEATURE_EMAIL_VERIFICATION
      ? "Sent after signup to verify the account's email address."
      : "Disabled on this deployment (FEATURE_EMAIL_VERIFICATION is off).",
  },
  {
    label: "Welcome email",
    detail: "Sent when a new account is created.",
  },
];

function describeDelivery(): { provider: string; configured: boolean; detail: string } {
  if (env.RESEND_API_KEY) {
    return { provider: "Resend", configured: true, detail: "Delivering via the Resend API." };
  }
  if (env.EMAIL_HOST && env.EMAIL_USER && env.EMAIL_PASS) {
    return {
      provider: "SMTP",
      configured: true,
      detail: `Delivering via SMTP (${env.EMAIL_HOST}).`,
    };
  }
  return {
    provider: "None",
    configured: false,
    detail:
      "No email provider is configured (set RESEND_API_KEY, or EMAIL_HOST/EMAIL_USER/EMAIL_PASS). In development, outgoing mail is logged to the server console instead.",
  };
}

export default async function SettingsEmailPage() {
  const organization = await getOrganization();
  const delivery = describeDelivery();

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader title="Email settings" />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Per-user email preferences
          </CardTitle>
          <CardDescription>
            The backend has no email-preferences store yet — there is no settings table or API route
            to persist a user&apos;s choices, so there is nothing to configure here. The
            notification toggles on the preferences page are placeholders for the same reason.
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Delivery on this deployment
          </CardTitle>
          <CardDescription>
            Transactional email is configured with environment variables at deploy time, not in the
            dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            {delivery.configured ? (
              <MailCheck className="h-5 w-5 text-emerald-600" />
            ) : (
              <MailX className="h-5 w-5 text-destructive" />
            )}
            <span className="font-medium">{delivery.provider}</span>
            <Badge variant={delivery.configured ? "default" : "secondary"}>
              {delivery.configured ? "Configured" : "Not configured"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{delivery.detail}</p>
          <Separator />
          <dl className="grid gap-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Sender address</dt>
              <dd className="font-medium">{env.EMAIL_FROM || "Not configured"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Organization shown in emails</dt>
              <dd className="font-medium">{organization.name}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Support email in templates</dt>
              <dd className="font-medium">{organization.supportEmail ?? "Not set"}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MailCheck className="h-5 w-5" />
            What actually gets sent
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {TRANSACTIONAL_EMAILS.map((email) => (
              <li key={email.label}>
                <p className="text-sm font-medium">{email.label}</p>
                <p className="text-sm text-muted-foreground">{email.detail}</p>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
