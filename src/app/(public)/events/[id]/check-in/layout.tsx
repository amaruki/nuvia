import { ReactNode } from "react";
import { requireDashboardRole } from "@/lib/require-dashboard-role";

export default async function EventCheckInLayout({ children }: { children: ReactNode }) {
  // Attendee check-in is a management action; this page lives under
  // (public) (URL-compatible with event revalidatePath calls)
  // but proxy.ts's matcher never reaches /events/**, so it gets no
  // authorization at all otherwise.
  await requireDashboardRole("/dashboard/events/checkin");

  return <>{children}</>;
}
