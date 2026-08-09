import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { MemberDue } from "@/types/finance";
import { formatCurrency } from "./helpers";

interface RecentDuesCardProps {
  dues: MemberDue[];
}

export function RecentDuesCard({ dues }: RecentDuesCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Dues</CardTitle>
        <CardDescription>Latest membership dues</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {dues.slice(0, 5).map((due) => (
            <div key={due.id} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{due.memberName}</p>
                <p className="text-xs text-muted-foreground">
                  {due.membershipTier} • Due {new Date(due.dueDate).toLocaleDateString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">{formatCurrency(due.balanceAmount)}</p>
                <Badge
                  variant={
                    due.status === "paid"
                      ? "default"
                      : due.status === "overdue"
                        ? "destructive"
                        : "secondary"
                  }
                  className="text-xs"
                >
                  {due.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
