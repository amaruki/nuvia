import { Badge } from "@/components/ui/badge";
import type { FinancialReport } from "@/types/finance";

export default function getStatusBadge(status: FinancialReport["status"]) {
  switch (status) {
    case "draft":
      return <Badge variant="secondary">Draft</Badge>;
    case "pending_review":
      return (
        <Badge variant="outline" className="border-yellow-500 text-yellow-600">
          Pending Review
        </Badge>
      );
    case "approved":
      return (
        <Badge variant="outline" className="border-blue-500 text-blue-600">
          Approved
        </Badge>
      );
    case "published":
      return <Badge variant="default">Published</Badge>;
    case "archived":
      return <Badge variant="outline">Archived</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}
