import { FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ArticleContentCardProps {
  content: string;
}

export function ArticleContentCard({ content }: ArticleContentCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Content
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="prose max-w-none">
          <p className="whitespace-pre-wrap">{content}</p>
        </div>
      </CardContent>
    </Card>
  );
}
