import { FlaskConical } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { isDemoMode } from "@/lib/env";

/**
 * Demo-sandbox notice (UI-39/D13). Reuses the exact mechanism of the global
 * DemoBanner: the lazy isDemoMode() flag read from DEMO_MODE per request.
 *
 * The demo ROLE never renders this component — isRoleAllowedForPath (the
 * nav-data gate, enforced by the proxy) rejects it before the page runs.
 * This notice covers the other sandbox case: a real superadmin viewing a
 * deployment that runs with DEMO_MODE=true.
 */
export function DemoSandboxNotice() {
  if (!isDemoMode()) return null;

  return (
    <Alert>
      <FlaskConical aria-hidden="true" />
      <AlertTitle>Demo sandbox</AlertTitle>
      <AlertDescription>
        This deployment runs with DEMO_MODE=true. The cache tool stays read-only in sandboxed mode:
        every value below is a live probe, and no operational action is offered.
      </AlertDescription>
    </Alert>
  );
}
