import { Badge } from "@/components/ui/badge";

export const getStatusBadge = (status: string) => {
  const variants = {
    active: "default" as const,
    archived: "secondary" as const,
    locked: "destructive" as const,
  };

  return (
    <Badge variant={variants[status as keyof typeof variants] || "secondary"}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
};

export const getTypeBadge = (type: string) => {
  const colors = {
    general: "bg-muted text-muted-foreground border-border",
    project: "bg-info/15 text-info border-info/25",
    document: "bg-success/15 text-success border-success/25",
    discussion: "bg-warning/15 text-warning border-warning/25",
    meeting: "bg-info/15 text-info border-info/25",
  };

  return (
    <Badge
      variant="outline"
      className={
        colors[type as keyof typeof colors] || "bg-muted text-muted-foreground border-border"
      }
    >
      {type.charAt(0).toUpperCase() + type.slice(1)}
    </Badge>
  );
};

export const getTaskStatusBadge = (status: string) => {
  const variants = {
    todo: "outline" as const,
    in_progress: "default" as const,
    review: "secondary" as const,
    completed: "default" as const,
    cancelled: "destructive" as const,
  };

  return (
    <Badge variant={variants[status as keyof typeof variants] || "secondary"}>
      {status.replace("_", " ").charAt(0).toUpperCase() + status.replace("_", " ").slice(1)}
    </Badge>
  );
};

export const getTaskPriorityBadge = (priority: string) => {
  const colors = {
    low: "bg-muted text-muted-foreground border-border",
    medium: "bg-info/15 text-info border-info/25",
    high: "bg-warning/15 text-warning border-warning/25",
    urgent: "bg-destructive/15 text-destructive border-destructive/25",
  };

  return (
    <Badge
      variant="outline"
      className={
        colors[priority as keyof typeof colors] || "bg-muted text-muted-foreground border-border"
      }
    >
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </Badge>
  );
};

export const getDocumentStatusBadge = (status: string) => {
  const variants = {
    draft: "outline" as const,
    review: "secondary" as const,
    approved: "default" as const,
    archived: "destructive" as const,
  };

  return (
    <Badge variant={variants[status as keyof typeof variants] || "secondary"}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
};

export const getDiscussionStatusBadge = (status: string) => {
  const variants = {
    active: "default" as const,
    closed: "secondary" as const,
    archived: "destructive" as const,
  };

  return (
    <Badge variant={variants[status as keyof typeof variants] || "secondary"}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
};

export const getMeetingStatusBadge = (status: string) => {
  const variants = {
    scheduled: "outline" as const,
    in_progress: "default" as const,
    completed: "secondary" as const,
    cancelled: "destructive" as const,
  };

  return (
    <Badge variant={variants[status as keyof typeof variants] || "secondary"}>
      {status.replace("_", " ").charAt(0).toUpperCase() + status.replace("_", " ").slice(1)}
    </Badge>
  );
};
