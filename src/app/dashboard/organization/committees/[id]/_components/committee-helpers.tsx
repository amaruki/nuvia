import { Badge } from "@/components/ui/badge";

export const getStatusBadge = (status: string) => {
  const variants = {
    active: "default" as const,
    inactive: "secondary" as const,
    pending: "outline" as const,
    suspended: "destructive" as const,
  };

  return (
    <Badge variant={variants[status as keyof typeof variants] || "secondary"}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
};

export const getTypeBadge = (type: string) => {
  const colors = {
    executive: "bg-info/15 text-info border-info/25",
    functional: "bg-muted text-muted-foreground border-border",
    special_interest: "bg-success/15 text-success border-success/25",
    ad_hoc: "bg-warning/15 text-warning border-warning/25",
    standing: "bg-info/15 text-info border-info/25",
  };

  return (
    <Badge
      variant="outline"
      className={
        colors[type as keyof typeof colors] || "bg-muted text-muted-foreground border-border"
      }
    >
      {type.replace("_", " ").charAt(0).toUpperCase() + type.replace("_", " ").slice(1)}
    </Badge>
  );
};

export const getAuthorityBadge = (authority: string) => {
  const variants = {
    executive: "default" as const,
    strategic: "secondary" as const,
    operational: "outline" as const,
    advisory: "destructive" as const,
  };

  return (
    <Badge variant={variants[authority as keyof typeof variants] || "secondary"}>
      {authority.charAt(0).toUpperCase() + authority.slice(1)}
    </Badge>
  );
};

export const formatPercentage = (value: number) => {
  return `${value.toFixed(1)}%`;
};
