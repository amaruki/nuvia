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
    executive: "bg-purple-100 text-purple-800 border-purple-200",
    functional: "bg-blue-100 text-blue-800 border-blue-200",
    special_interest: "bg-green-100 text-green-800 border-green-200",
    ad_hoc: "bg-orange-100 text-orange-800 border-orange-200",
    standing: "bg-indigo-100 text-indigo-800 border-indigo-200",
  };

  return (
    <Badge
      variant="outline"
      className={colors[type as keyof typeof colors] || "bg-gray-100 text-gray-800 border-gray-200"}
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
