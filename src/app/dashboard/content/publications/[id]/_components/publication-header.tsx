import { Calendar, Clock, FileText, Pin, Star, Tag, User } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { Publication } from "@/types/publication";
import {
  PUBLICATION_CATEGORY_DISPLAY,
  PUBLICATION_STATUS_DISPLAY,
  PUBLICATION_TYPE_DISPLAY,
} from "@/types/publication";
import { formatDate } from "./publication-helpers";

interface PublicationHeaderProps {
  publication: Publication;
}

export function PublicationHeader({ publication }: PublicationHeaderProps) {
  const typeDisplay = PUBLICATION_TYPE_DISPLAY[publication.type];
  const categoryDisplay = PUBLICATION_CATEGORY_DISPLAY[publication.category];
  const statusDisplay = PUBLICATION_STATUS_DISPLAY[publication.status];

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">{publication.title}</h1>
          <p className="text-lg text-muted-foreground">{publication.excerpt}</p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <Badge variant={statusDisplay.badgeVariant} className="flex items-center gap-1">
            {statusDisplay.name}
          </Badge>
          {publication.isFeatured && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Star className="h-3 w-3" />
              Featured
            </Badge>
          )}
          {publication.isPinned && (
            <Badge variant="outline" className="flex items-center gap-1">
              <Pin className="h-3 w-3" />
              Pinned
            </Badge>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-1">
          <User className="h-4 w-4" />
          {publication.author.name}
        </div>
        <div className="flex items-center gap-1">
          <Calendar className="h-4 w-4" />
          {formatDate(publication.lastModified)}
        </div>
        <div className="flex items-center gap-1">
          <Clock className="h-4 w-4" />
          {publication.readTime} min read
        </div>
        <div className="flex items-center gap-1">
          <FileText className="h-4 w-4" />
          {publication.wordCount} words
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="flex items-center gap-1">
          {typeDisplay.name}
        </Badge>
        <Badge variant="outline" className="flex items-center gap-1">
          {categoryDisplay.name}
        </Badge>
        <Badge variant="outline" className="flex items-center gap-1">
          {publication.difficulty}
        </Badge>
        {publication.tags.map((tag) => (
          <Badge key={tag.id} variant="secondary" className="flex items-center gap-1">
            <Tag className="h-3 w-3" />
            {tag.name}
          </Badge>
        ))}
      </div>
    </div>
  );
}
