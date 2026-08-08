import { Badge } from "@/components/ui/badge";
import type { Invoice } from "@/types/finance";
import { getStatusBadge } from "./helpers";

interface InvoiceStatusBadgeProps {
  invoice: Invoice;
  className?: string;
}

export default function InvoiceStatusBadge({ invoice, className }: InvoiceStatusBadgeProps) {
  const statusBadge = getStatusBadge(invoice.status);
  const StatusIcon = statusBadge.icon;

  return (
    <Badge variant={statusBadge.variant} className={className}>
      <StatusIcon className="h-3 w-3" />
      {statusBadge.text}
    </Badge>
  );
}
