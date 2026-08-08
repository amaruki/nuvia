import { Megaphone } from "lucide-react";

export function AcknowledgmentsTab() {
  return (
    <div className="text-center py-8 text-muted-foreground">
      <Megaphone className="h-12 w-12 mx-auto mb-4 opacity-50" />
      <p>No acknowledgment analytics to display</p>
      <p className="text-sm mt-2">
        Acknowledgment statistics will appear here once announcements are created
      </p>
    </div>
  );
}
