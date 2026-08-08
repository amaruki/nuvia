import { Mail } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Donation } from "@/types/finance";
import { getDonorTypeIcon, getStatusBadge } from "./helpers";

interface DonorInfoSectionProps {
  donation: Donation;
}

export default function DonorInfoSection({ donation }: DonorInfoSectionProps) {
  const statusBadge = getStatusBadge(donation.status);
  const StatusIcon = statusBadge.icon;
  const DonorTypeIcon = getDonorTypeIcon(donation.donorType);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Donor Information</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1 sm:space-y-2">
          <div className="flex items-center gap-2">
            <DonorTypeIcon className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-sm font-medium">Donor Name</span>
          </div>
          <p className="text-sm break-words">{donation.donorName}</p>
        </div>
        <div className="space-y-1 sm:space-y-2">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-sm font-medium">Email</span>
          </div>
          <p className="text-sm break-all">{donation.donorEmail}</p>
        </div>
        <div className="space-y-1 sm:space-y-2">
          <div className="flex items-center gap-2">
            <DonorTypeIcon className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-sm font-medium">Donor Type</span>
          </div>
          <Badge variant="outline" className="w-fit capitalize">
            {donation.donorType}
          </Badge>
        </div>
        <div className="space-y-1 sm:space-y-2">
          <div className="flex items-center gap-2">
            <StatusIcon className={`h-4 w-4 shrink-0 ${statusBadge.color}`} />
            <span className="text-sm font-medium">Status</span>
          </div>
          <Badge variant={statusBadge.variant} className="flex items-center gap-1 w-fit">
            <StatusIcon className="h-3 w-3 shrink-0" />
            {statusBadge.text}
          </Badge>
        </div>
      </div>
    </div>
  );
}
