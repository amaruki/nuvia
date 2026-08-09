import { ReactNode } from "react";
import { requireDashboardRole } from "@/lib/require-dashboard-role";

export default async function EventsDashboardLayout({ children }: { children: ReactNode }) {
  // Event organizer overview; lives under (public) but proxy.ts's matcher
  // never reaches /events/**, so it gets no authorization at all
  // otherwise. See TODO.md M1.
  await requireDashboardRole("/dashboard/events");

  return <>{children}</>;
}
