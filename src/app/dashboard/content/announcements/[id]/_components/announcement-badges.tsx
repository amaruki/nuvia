import {
  AlertTriangle,
  Archive,
  Bell,
  Calendar,
  CheckCircle2,
  Clock,
  Star,
  type LucideIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { AnnouncementPriority } from "@/types/announcement";
import type { ArticleStatus } from "@/types/article";

interface BadgeConfig {
  label: string;
  variant: "default" | "secondary" | "destructive" | "outline";
  icon: LucideIcon;
}

const DRAFT_STATUS_BADGE: BadgeConfig = { label: "Draft", variant: "secondary", icon: Clock };

const STATUS_BADGES: Partial<Record<ArticleStatus, BadgeConfig>> = {
  draft: DRAFT_STATUS_BADGE,
  published: { label: "Published", variant: "default", icon: CheckCircle2 },
  scheduled: { label: "Scheduled", variant: "outline", icon: Calendar },
  archived: { label: "Archived", variant: "secondary", icon: Archive },
};

const PRIORITY_BADGES: Record<AnnouncementPriority, BadgeConfig> = {
  urgent: { label: "Urgent", variant: "destructive", icon: AlertTriangle },
  high: { label: "High", variant: "default", icon: Bell },
  medium: { label: "Medium", variant: "secondary", icon: Star },
  low: { label: "Low", variant: "outline", icon: Clock },
};

interface AnnouncementStatusBadgeProps {
  status: ArticleStatus;
}

export function AnnouncementStatusBadge({ status }: AnnouncementStatusBadgeProps) {
  const config = STATUS_BADGES[status] ?? DRAFT_STATUS_BADGE;
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}

interface AnnouncementPriorityBadgeProps {
  priority: AnnouncementPriority;
}

export function AnnouncementPriorityBadge({ priority }: AnnouncementPriorityBadgeProps) {
  const config = PRIORITY_BADGES[priority] ?? PRIORITY_BADGES.low;
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}
