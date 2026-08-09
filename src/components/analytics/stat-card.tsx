import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export interface StatCardProps {
  label: string;
  /** Pre-formatted aggregate value, e.g. "1,204" or "$3,450.00". */
  value: string;
  hint?: string;
}

/** Server-rendered KPI tile; the value comes straight from a service aggregate. */
export function StatCard({ label, value, hint }: StatCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl tabular-nums">{value}</CardTitle>
      </CardHeader>
      {hint ? (
        <CardContent>
          <p className="text-xs text-muted-foreground">{hint}</p>
        </CardContent>
      ) : null}
    </Card>
  );
}
