import { Badge } from "@/components/ui/badge";

const STATUS_BADGE_VARIANTS = {
  active: "default",
  archived: "secondary",
  locked: "destructive",
} as const;

const TYPE_BADGE_COLORS = {
  general: "bg-muted text-muted-foreground border-border",
  project: "bg-info/15 text-info border-info/25",
  document: "bg-success/15 text-success border-success/25",
  discussion: "bg-warning/15 text-warning border-warning/25",
  meeting: "bg-info/15 text-info border-info/25",
};

interface WorkspaceStatusBadgeProps {
  status: string;
}

export function WorkspaceStatusBadge({ status }: WorkspaceStatusBadgeProps) {
  const variant =
    STATUS_BADGE_VARIANTS[status as keyof typeof STATUS_BADGE_VARIANTS] || "secondary";

  return <Badge variant={variant}>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>;
}

interface WorkspaceTypeBadgeProps {
  type: string;
}

export function WorkspaceTypeBadge({ type }: WorkspaceTypeBadgeProps) {
  const className =
    TYPE_BADGE_COLORS[type as keyof typeof TYPE_BADGE_COLORS] ||
    "bg-muted text-muted-foreground border-border";

  return (
    <Badge variant="outline" className={className}>
      {type.charAt(0).toUpperCase() + type.slice(1)}
    </Badge>
  );
}
