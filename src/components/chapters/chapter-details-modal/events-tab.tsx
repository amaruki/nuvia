import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Calendar } from "lucide-react";
import type { Chapter } from "@/types/chapter.types";
import { formatCurrency } from "./helpers";

interface EventsTabProps {
  chapter: Chapter;
}

export default function EventsTab({ chapter }: EventsTabProps) {
  return (
    <TabsContent value="events" className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Chapter Events</CardTitle>
        </CardHeader>
        <CardContent>
          {chapter.events.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Attendance</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {chapter.events.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell className="font-medium">{event.title}</TableCell>
                    <TableCell>{event.date.toLocaleDateString()}</TableCell>
                    <TableCell>{event.attendance}</TableCell>
                    <TableCell>{formatCurrency(event.revenue)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          event.status === "completed"
                            ? "default"
                            : event.status === "upcoming"
                              ? "secondary"
                              : "outline"
                        }
                      >
                        {event.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No events scheduled</p>
            </div>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  );
}
