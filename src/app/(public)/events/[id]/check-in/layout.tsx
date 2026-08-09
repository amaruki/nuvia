import { ReactNode } from "react";
import { requireDashboardRole } from "@/lib/require-dashboard-role";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default async function EventCheckInLayout({ children }: { children: ReactNode }) {
  // Attendee check-in is a management action; this page lives under
  // (public) (URL-compatible with event.actions.ts's revalidatePath calls)
  // but proxy.ts's matcher never reaches /events/**, so it gets no
  // authorization at all otherwise. See TODO.md M1.
  await requireDashboardRole("/dashboard/events/checkin");

  return <>{children}</>;
}
