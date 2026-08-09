import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  Archive,
  Bell,
  Calendar,
  CheckCircle2,
  Clock,
  Eye,
  Star,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ArticleStatus } from "@/types/article";

export const getStatusBadge = (status: ArticleStatus) => {
  const statusConfig: Record<
    ArticleStatus,
    {
      label: string;
      variant: "default" | "secondary" | "destructive" | "outline";
      icon: LucideIcon;
    }
  > = {
    draft: { label: "Draft", variant: "secondary", icon: Clock },
    published: { label: "Published", variant: "default", icon: CheckCircle2 },
    scheduled: { label: "Scheduled", variant: "outline", icon: Calendar },
    review: { label: "Under Review", variant: "outline", icon: Eye },
    archived: { label: "Archived", variant: "secondary", icon: Archive },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
};

export const getPriorityBadge = (priority: string) => {
  const priorityConfig = {
    urgent: { label: "Urgent", variant: "destructive" as const, icon: AlertTriangle },
    high: { label: "High", variant: "default" as const, icon: Bell },
    medium: { label: "Medium", variant: "secondary" as const, icon: Star },
    low: { label: "Low", variant: "outline" as const, icon: Clock },
  };

  const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.low;
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
};
