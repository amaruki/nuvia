import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ArticleAuthor } from "@/types/article";

interface AnnouncementAuthorCardProps {
  author: ArticleAuthor;
}

export function AnnouncementAuthorCard({ author }: AnnouncementAuthorCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Author</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3">
          {author.avatar && (
            <img src={author.avatar} alt={author.name} className="w-10 h-10 rounded-full" />
          )}
          <div>
            <p className="font-medium">{author.name}</p>
            <p className="text-sm text-muted-foreground">{author.role}</p>
            {author.chapter && <p className="text-xs text-muted-foreground">{author.chapter}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
