import { Badge } from "@/components/ui/badge";
import { Calendar, FileText, Mail, User } from "lucide-react";
import type { Invoice } from "@/types/finance";
import type { InvoiceStatusMeta } from "./types";

interface ClientInfoSectionProps {
  invoice: Invoice;
  statusMeta: InvoiceStatusMeta;
}

export function ClientInfoSection({ invoice, statusMeta }: ClientInfoSectionProps) {
  const StatusIcon = statusMeta.icon;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Client Information</h3>
      {/* Responsive Grid: Stacks on mobile, 2 cols on tablet/desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1 sm:space-y-2">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-sm font-medium">Client Name</span>
          </div>
          <p className="text-sm break-words">{invoice.clientName}</p>
        </div>
        <div className="space-y-1 sm:space-y-2">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-sm font-medium">Email</span>
          </div>
          <p className="text-sm break-all">{invoice.clientEmail}</p>
        </div>
        <div className="space-y-1 sm:space-y-2">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-sm font-medium">Invoice Number</span>
          </div>
          <p className="text-sm font-mono break-all">{invoice.invoiceNumber}</p>
        </div>
        <div className="space-y-1 sm:space-y-2">
          <div className="flex items-center gap-2">
            <StatusIcon className={`h-4 w-4 shrink-0 ${statusMeta.color}`} />
            <span className="text-sm font-medium">Status</span>
          </div>
          <Badge variant={statusMeta.variant} className="flex items-center gap-1 w-fit">
            <StatusIcon className="h-3 w-3 shrink-0" />
            {statusMeta.text}
          </Badge>
        </div>
      </div>

      {invoice.clientAddress && (
        <div className="space-y-1 sm:space-y-2">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-sm font-medium">Address</span>
          </div>
          <p className="text-sm break-words">{invoice.clientAddress}</p>
        </div>
      )}
    </div>
  );
}
