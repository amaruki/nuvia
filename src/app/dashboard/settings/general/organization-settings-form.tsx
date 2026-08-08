"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";

export interface OrganizationFormValues {
  name: string;
  legalName: string | null;
  logo: string | null;
  website: string | null;
  supportEmail: string | null;
  locale: string;
  currency: string;
  timezone: string;
}

interface OrganizationSettingsFormProps {
  organization: OrganizationFormValues;
  canEdit: boolean;
}

const LOCALE_OPTIONS = [
  "en",
  "en-US",
  "en-GB",
  "id-ID",
  "de-DE",
  "es-ES",
  "fr-FR",
  "pt-BR",
  "ja-JP",
  "zh-CN",
  "ar-SA",
  "hi-IN",
] as const;

const CURRENCY_OPTIONS = [
  "USD",
  "EUR",
  "GBP",
  "IDR",
  "SGD",
  "MYR",
  "AUD",
  "CAD",
  "JPY",
  "CHF",
  "INR",
  "PHP",
  "THB",
  "VND",
] as const;

const TIMEZONE_SUGGESTIONS = [
  "UTC",
  "Asia/Jakarta",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Asia/Kolkata",
  "Asia/Dubai",
  "Australia/Sydney",
  "Europe/London",
  "Europe/Berlin",
  "Europe/Paris",
  "America/New_York",
  "America/Chicago",
  "America/Los_Angeles",
  "America/Sao_Paulo",
] as const;

interface FieldError {
  field: string;
  message: string;
}

export function OrganizationSettingsForm({ organization, canEdit }: OrganizationSettingsFormProps) {
  const router = useRouter();
  const [values, setValues] = React.useState({
    name: organization.name,
    legalName: organization.legalName ?? "",
    logo: organization.logo ?? "",
    website: organization.website ?? "",
    supportEmail: organization.supportEmail ?? "",
    locale: organization.locale,
    currency: organization.currency,
    timezone: organization.timezone,
  });
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<FieldError[]>([]);

  const setField = (field: keyof typeof values) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setValues((previous) => ({ ...previous, [field]: event.target.value }));
  };

  const fieldError = (field: string) => fieldErrors.find((error) => error.field === field)?.message;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setSuccessMessage(null);
    setErrorMessage(null);
    setFieldErrors([]);

    try {
      const response = await fetch("/api/v1/organization", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const body = await response.json().catch(() => null);

      if (!response.ok) {
        setErrorMessage(body?.detail || body?.title || "Failed to save organization settings");
        if (Array.isArray(body?.errors)) {
          setFieldErrors(body.errors);
        }
        return;
      }

      setSuccessMessage("Organization settings saved.");
      router.refresh();
    } catch {
      setErrorMessage("Network error — please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!canEdit) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          You need the <code>organization:update</code> permission to edit these settings.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {successMessage && (
        <Alert>
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}

      {errorMessage && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {errorMessage}
            {fieldErrors.length > 0 && (
              <ul className="mt-2 list-disc pl-4 text-sm">
                {fieldErrors.map((error) => (
                  <li key={`${error.field}-${error.message}`}>
                    <span className="font-medium">{error.field}</span>: {error.message}
                  </li>
                ))}
              </ul>
            )}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="org-name">Organization name *</Label>
            <Input
              id="org-name"
              name="name"
              value={values.name}
              onChange={setField("name")}
              required
              maxLength={200}
              aria-invalid={Boolean(fieldError("name"))}
            />
            {fieldError("name") && <p className="text-sm text-destructive">{fieldError("name")}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="org-legalName">Legal name</Label>
            <Input
              id="org-legalName"
              name="legalName"
              value={values.legalName}
              onChange={setField("legalName")}
              maxLength={300}
              placeholder="Registered legal entity name"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="org-website">Website</Label>
              <Input
                id="org-website"
                name="website"
                type="url"
                value={values.website}
                onChange={setField("website")}
                maxLength={500}
                placeholder="https://example.org"
              />
              {fieldError("website") && (
                <p className="text-sm text-destructive">{fieldError("website")}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="org-supportEmail">Support email</Label>
              <Input
                id="org-supportEmail"
                name="supportEmail"
                type="email"
                value={values.supportEmail}
                onChange={setField("supportEmail")}
                maxLength={320}
                placeholder="support@example.org"
              />
              {fieldError("supportEmail") && (
                <p className="text-sm text-destructive">{fieldError("supportEmail")}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="org-logo">Logo URL</Label>
            <Input
              id="org-logo"
              name="logo"
              type="url"
              value={values.logo}
              onChange={setField("logo")}
              maxLength={500}
              placeholder="https://example.org/logo.png"
            />
            {fieldError("logo") && <p className="text-sm text-destructive">{fieldError("logo")}</p>}
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="org-locale">Locale</Label>
              <Input
                id="org-locale"
                name="locale"
                list="org-locale-options"
                value={values.locale}
                onChange={setField("locale")}
                required
                maxLength={35}
              />
              <datalist id="org-locale-options">
                {LOCALE_OPTIONS.map((locale) => (
                  <option key={locale} value={locale} />
                ))}
              </datalist>
              {fieldError("locale") && (
                <p className="text-sm text-destructive">{fieldError("locale")}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="org-currency">Currency</Label>
              <Input
                id="org-currency"
                name="currency"
                list="org-currency-options"
                value={values.currency}
                onChange={setField("currency")}
                required
                maxLength={3}
                placeholder="USD"
              />
              <datalist id="org-currency-options">
                {CURRENCY_OPTIONS.map((currency) => (
                  <option key={currency} value={currency} />
                ))}
              </datalist>
              {fieldError("currency") && (
                <p className="text-sm text-destructive">{fieldError("currency")}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="org-timezone">Timezone</Label>
              <Input
                id="org-timezone"
                name="timezone"
                list="org-timezone-options"
                value={values.timezone}
                onChange={setField("timezone")}
                required
                maxLength={64}
                placeholder="UTC"
              />
              <datalist id="org-timezone-options">
                {TIMEZONE_SUGGESTIONS.map((timezone) => (
                  <option key={timezone} value={timezone} />
                ))}
              </datalist>
              {fieldError("timezone") && (
                <p className="text-sm text-destructive">{fieldError("timezone")}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save organization settings
        </Button>
      </div>
    </form>
  );
}
