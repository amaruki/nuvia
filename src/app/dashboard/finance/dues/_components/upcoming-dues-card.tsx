import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { MemberDue } from "@/types/finance";
import { formatCurrency } from "./helpers";

interface UpcomingDuesCardProps {
  dues: MemberDue[];
}

export function UpcomingDuesCard({ dues }: UpcomingDuesCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Upcoming Dues</CardTitle>
        <CardDescription>Dues due in the next 30 days</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {dues
            .filter(
              (due) =>
                due.status === "pending" &&
                new Date(due.dueDate) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            )
            .slice(0, 5)
            .map((due) => (
              <div key={due.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{due.memberName}</p>
                  <p className="text-xs text-muted-foreground">{due.membershipTier}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{formatCurrency(due.dueAmount)}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(due.dueDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
}
