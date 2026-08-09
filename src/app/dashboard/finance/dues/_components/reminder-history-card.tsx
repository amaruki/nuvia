import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function ReminderHistoryCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Reminder History</CardTitle>
        <CardDescription>Sent and scheduled reminders</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border border-dashed p-6 text-center">
          <p className="text-sm font-medium">No reminders are tracked yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            The membership schema has no reminders store. Sending a reminder from the dues table
            reports this honestly instead of recording anything.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
