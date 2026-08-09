import { Badge } from "@/components/ui/badge";

const STATUS_BADGE_VARIANTS = {
  active: "default",
  inactive: "secondary",
  pending: "outline",
  suspended: "destructive",
} as const;

const TYPE_BADGE_COLORS = {
  executive: "bg-info/15 text-info border-info/25",
  functional: "bg-muted text-muted-foreground border-border",
  special_interest: "bg-success/15 text-success border-success/25",
  ad_hoc: "bg-warning/15 text-warning border-warning/25",
  standing: "bg-info/15 text-info border-info/25",
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
    "bg-muted text-muted-foreground border-border";
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
