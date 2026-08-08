import Link from "next/link";
import { BarChart3 } from "lucide-react";

import { Button } from "@/components/ui/button";

export function AnalyticsTab() {
  return (
    <div className="text-center py-8 text-muted-foreground">
      <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
      <p className="text-lg font-medium mb-2">Media Analytics</p>
      <p className="text-sm mb-4">
        Track views, downloads, and usage patterns across your media library
      </p>
      <Link href="/dashboard/content/media/analytics">
        <Button>
          <BarChart3 className="h-4 w-4 mr-2" />
          View Detailed Analytics
        </Button>
      </Link>
    </div>
  );
}
