import { Badge } from "@/components/ui/badge";

export default function getEnvironmentBadge(environment: string) {
  return (
    <Badge variant={environment === "production" ? "default" : "outline"}>
      {environment === "production" ? "Production" : "Sandbox"}
    </Badge>
  );
}
