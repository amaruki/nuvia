import type { ReactNode } from "react";

import DashboardClientLayout from "./_components/dashboard-client-layout";
import { DemoBanner } from "./_components/demo-banner";

/**
 * Dashboard root layout — a server wrapper (UI-39).
 *
 * The interactive shell (sidebar, header, footer, providers) lives in
 * _components/dashboard-client-layout.tsx; this wrapper exists so demo mode
 * can render its banner above the client tree on EVERY dashboard page,
 * server-side, reading DEMO_MODE per request.
 */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <DemoBanner />
      <DashboardClientLayout>{children}</DashboardClientLayout>
    </>
  );
}
