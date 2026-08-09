import { Badge } from "@/components/ui/badge";

const STATUS_BADGE_VARIANTS = {
  active: "default",
  inactive: "secondary",
  pending: "outline",
  suspended: "destructive",
} as const;

const FINANCIAL_HEALTH_BADGE_VARIANTS = {
  excellent: "default",
  good: "secondary",
  fair: "outline",
  poor: "destructive",
} as const;

interface ChapterStatusBadgeProps {
  status: string;
}

export function ChapterStatusBadge({ status }: ChapterStatusBadgeProps) {
  const variant =
    STATUS_BADGE_VARIANTS[status as keyof typeof STATUS_BADGE_VARIANTS] || "secondary";

  return <Badge variant={variant}>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>;
}

interface FinancialHealthBadgeProps {
  health: string;
}

export function FinancialHealthBadge({ health }: FinancialHealthBadgeProps) {
  const variant =
    FINANCIAL_HEALTH_BADGE_VARIANTS[health as keyof typeof FINANCIAL_HEALTH_BADGE_VARIANTS] ||
    "secondary";

  return <Badge variant={variant}>{health.charAt(0).toUpperCase() + health.slice(1)}</Badge>;
}
