import { Badge } from "@/components/ui/badge";

const STATUS_BADGE_VARIANTS = {
  active: "default",
  archived: "secondary",
  locked: "destructive",
} as const;

const TYPE_BADGE_COLORS = {
  general: "bg-blue-100 text-blue-800 border-blue-200",
  project: "bg-purple-100 text-purple-800 border-purple-200",
  document: "bg-green-100 text-green-800 border-green-200",
  discussion: "bg-orange-100 text-orange-800 border-orange-200",
  meeting: "bg-indigo-100 text-indigo-800 border-indigo-200",
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
    "bg-gray-100 text-gray-800 border-gray-200";

  return (
    <Badge variant="outline" className={className}>
      {type.charAt(0).toUpperCase() + type.slice(1)}
    </Badge>
  );
}
