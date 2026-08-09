import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, Clock, CreditCard, XCircle } from "lucide-react";
import type { MemberDue } from "@/types/finance";

const DUE_STATUS_BADGES = {
  paid: { variant: "default", icon: CheckCircle, text: "Paid" },
  pending: { variant: "secondary", icon: Clock, text: "Pending" },
  overdue: { variant: "destructive", icon: AlertCircle, text: "Overdue" },
  partial: { variant: "outline", icon: CreditCard, text: "Partial" },
  cancelled: { variant: "outline", icon: XCircle, text: "Cancelled" },
} as const;

interface DueStatusBadgeProps {
  status: MemberDue["status"];
}

export function DueStatusBadge({ status }: DueStatusBadgeProps) {
  const badge =
    DUE_STATUS_BADGES[status] ?? ({ variant: "secondary", icon: Clock, text: status } as const);
  const StatusIcon = badge.icon;

  return (
    <Badge variant={badge.variant} className="flex items-center gap-1 w-fit">
      <StatusIcon className="h-3 w-3" />
      {badge.text}
    </Badge>
  );
}
