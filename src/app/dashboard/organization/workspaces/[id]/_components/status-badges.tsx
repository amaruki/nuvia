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
    general: "bg-blue-100 text-blue-800 border-blue-200",
    project: "bg-purple-100 text-purple-800 border-purple-200",
    document: "bg-green-100 text-green-800 border-green-200",
    discussion: "bg-orange-100 text-orange-800 border-orange-200",
    meeting: "bg-indigo-100 text-indigo-800 border-indigo-200",
  };

  return (
    <Badge
      variant="outline"
      className={colors[type as keyof typeof colors] || "bg-gray-100 text-gray-800 border-gray-200"}
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
    low: "bg-gray-100 text-gray-800 border-gray-200",
    medium: "bg-blue-100 text-blue-800 border-blue-200",
    high: "bg-orange-100 text-orange-800 border-orange-200",
    urgent: "bg-red-100 text-red-800 border-red-200",
  };

  return (
    <Badge
      variant="outline"
      className={
        colors[priority as keyof typeof colors] || "bg-gray-100 text-gray-800 border-gray-200"
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
