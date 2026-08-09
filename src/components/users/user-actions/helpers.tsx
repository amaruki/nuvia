import { ShieldCheck } from "lucide-react";
import type { BulkAction } from "./types";

/**
 * The only bulk operation backed by a real API is the bulk role update
 * (POST /api/v1/admin/users/bulk-role-update). All other former actions had
 * no server-side implementation and were removed rather than faked.
 */
export function getBulkActions(): BulkAction[] {
  return [
    {
      type: "change_role",
      label: "Change Role",
      description: "Update the role of the selected users",
      icon: <ShieldCheck className="size-4" />,
      variant: "outline",
      requiresRole: true,
    },
  ];
}
