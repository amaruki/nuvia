import { Archive, Download, Settings, Share2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ArticleActionsCardProps {
  downloadEnabled: boolean;
  onShare: () => void;
}

export function ArticleActionsCard({ downloadEnabled, onShare }: ArticleActionsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={onShare}>
            <Share2 className="w-4 h-4 mr-2" />
            Share Article
          </Button>
          {downloadEnabled && (
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          )}
          <Button variant="outline">
            <Archive className="w-4 h-4 mr-2" />
            Archive
          </Button>
          <Button variant="destructive">
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
