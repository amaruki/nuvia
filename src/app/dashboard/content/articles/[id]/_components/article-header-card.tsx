import { Calendar, Pin, Star, Timer, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Article } from "@/types/article";
import { formatDate } from "./article-helpers";

interface ArticleHeaderCardProps {
  article: Article;
}

export function ArticleHeaderCard({ article }: ArticleHeaderCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-3">
              <CardTitle className="text-2xl">{article.title}</CardTitle>
              {article.isFeatured && <Star className="w-5 h-5 text-yellow-500 fill-current" />}
              {article.isPinned && <Pin className="w-5 h-5 text-primary" />}
            </div>

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <Badge variant="secondary">{article.type.replace("_", " ")}</Badge>
              <Badge variant="outline">{article.category.replace("_", " ")}</Badge>
              <Badge variant="outline">{article.difficulty}</Badge>
              <Badge variant="outline">{article.format}</Badge>
            </div>
          </div>

          <div className="text-right">
            <Badge
              variant={article.status === "published" ? "default" : "secondary"}
              className="text-sm"
            >
              {article.status.replace("_", " ")}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground">{article.excerpt}</p>

        <div className="flex items-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4" />
            <span>By {article.author.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>Published {formatDate(article.publishedAt)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Timer className="w-4 h-4" />
            <span>{article.readTime} min read</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
