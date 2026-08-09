import Link from "next/link";
import { ArrowRight, Calendar, MapPin, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { PublicChapterSummary } from "@/lib/services/chapter";
import { formatDate } from "@/lib/utils/date-utils";

export function ChapterCard({ chapter }: { chapter: PublicChapterSummary }) {
  const location = [chapter.city, chapter.region, chapter.country].filter(Boolean).join(", ");

  return (
    <Card className="h-full hover:shadow-md transition-shadow">
      <CardContent className="p-6 flex flex-col h-full">
        <h3 className="text-lg font-semibold mb-2">{chapter.displayName}</h3>
        {chapter.description && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-3">{chapter.description}</p>
        )}

        <div className="mt-auto space-y-2 text-sm text-muted-foreground">
          {location && (
            <div className="flex items-center">
              <MapPin className="h-4 w-4 mr-2 shrink-0" />
              {location}
            </div>
          )}
          <div className="flex items-center">
            <Users className="h-4 w-4 mr-2 shrink-0" />
            {chapter.memberCount} member{chapter.memberCount === 1 ? "" : "s"}
          </div>
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-2 shrink-0" />
            Established {formatDate(chapter.establishedDate, "yyyy")}
          </div>
        </div>

        <Link
          href={`/chapters/${chapter.id}`}
          className="mt-4 inline-flex items-center text-blue-600 hover:underline text-sm font-medium"
        >
          View chapter
          <ArrowRight className="h-4 w-4 ml-1" />
        </Link>
      </CardContent>
    </Card>
  );
}
