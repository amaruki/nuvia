import { Badge } from "@/components/ui/badge";

export default function getStatusBadge(status: string) {
  const variants = {
    active: "default" as const,
    inactive: "secondary" as const,
    testing: "outline" as const,
    error: "destructive" as const,
  };

  return (
    <Badge variant={variants[status as keyof typeof variants] || "secondary"}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}
