import { Badge } from "@/components/ui/badge";

const STATUS_BADGE_VARIANTS = {
  active: "default",
  inactive: "secondary",
  pending: "outline",
  suspended: "destructive",
} as const;

const TYPE_BADGE_COLORS = {
  executive: "bg-purple-100 text-purple-800 border-purple-200",
  functional: "bg-blue-100 text-blue-800 border-blue-200",
  special_interest: "bg-green-100 text-green-800 border-green-200",
  ad_hoc: "bg-orange-100 text-orange-800 border-orange-200",
  standing: "bg-indigo-100 text-indigo-800 border-indigo-200",
};

const AUTHORITY_BADGE_VARIANTS = {
  executive: "default",
  strategic: "secondary",
  operational: "outline",
  advisory: "destructive",
} as const;

interface CommitteeStatusBadgeProps {
  status: string;
}

export function CommitteeStatusBadge({ status }: CommitteeStatusBadgeProps) {
  const variant =
    STATUS_BADGE_VARIANTS[status as keyof typeof STATUS_BADGE_VARIANTS] || "secondary";

  return <Badge variant={variant}>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>;
}

interface CommitteeTypeBadgeProps {
  type: string;
}

export function CommitteeTypeBadge({ type }: CommitteeTypeBadgeProps) {
  const className =
    TYPE_BADGE_COLORS[type as keyof typeof TYPE_BADGE_COLORS] ||
    "bg-gray-100 text-gray-800 border-gray-200";
  const label = type.replace("_", " ");

  return (
    <Badge variant="outline" className={className}>
      {label.charAt(0).toUpperCase() + label.slice(1)}
    </Badge>
  );
}

interface CommitteeAuthorityBadgeProps {
  authority: string;
}

export function CommitteeAuthorityBadge({ authority }: CommitteeAuthorityBadgeProps) {
  const variant =
    AUTHORITY_BADGE_VARIANTS[authority as keyof typeof AUTHORITY_BADGE_VARIANTS] || "secondary";

  return <Badge variant={variant}>{authority.charAt(0).toUpperCase() + authority.slice(1)}</Badge>;
}
