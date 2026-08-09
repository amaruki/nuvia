"use client";

/**
 * UI-34 — pay-now island. POSTs to the member pay route and renders exactly
 * what the server decides: navigate to the hosted checkout (stripe track)
 * or show the honest offline-payment guidance (manual track). It never
 * assumes an outcome, and it shows the server's own words — no client-side
 * copy about amounts or settlement.
 */

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { ApiClientError, apiFetch } from "@/lib/api-client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { MemberPayNowResult } from "@/lib/services/finance";

export function PayNowButton({ invoiceId }: { invoiceId: string }) {
  const [busy, setBusy] = useState(false);
  const [guidance, setGuidance] = useState<readonly string[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pay = async () => {
    setBusy(true);
    setError(null);
    try {
      const envelope = await apiFetch<MemberPayNowResult>(
        `/api/v1/finance/my/invoices/${invoiceId}/pay`,
        {
          method: "POST",
          body: JSON.stringify({ returnUrl: window.location.href }),
        },
      );

      if (envelope.data.track === "stripe") {
        // Stay busy while the browser navigates to the hosted checkout.
        window.location.assign(envelope.data.checkoutUrl);
        return;
      }

      setGuidance(envelope.data.guidance);
      setBusy(false);
    } catch (err) {
      setError(
        err instanceof ApiClientError ? err.message : "Could not start payment. Please try again.",
      );
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2">
      <Button size="sm" onClick={pay} disabled={busy}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Pay now
      </Button>

      {guidance && (
        <Alert>
          <AlertDescription>
            <ul className="list-disc space-y-1 pl-4 text-sm">
              {guidance.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
