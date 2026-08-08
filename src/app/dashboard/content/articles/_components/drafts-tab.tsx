"use client";

import { FileText, Settings } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Article } from "@/types/article.types";

interface DraftsTabProps {
  articles: Article[];
  onEdit: (article: Article) => void;
  onPublish: (article: Article) => void;
}

export function DraftsTab({ articles, onEdit, onPublish }: DraftsTabProps) {
  const draftArticles = articles.filter((article) => article.status === "draft");

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Draft Articles</h3>
      <div className="space-y-3">
        {draftArticles.map((article) => (
          <div key={article.id} className="flex items-center justify-between p-3 border rounded-lg">
            <div className="min-w-0 flex-1 mr-2">
              <p className="font-medium">{article.title}</p>
              <p className="text-xs text-muted-foreground">
                Last modified: {article.lastModified.toLocaleDateString()}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => onEdit(article)}>
                <Settings className="mr-2 h-4 w-4" />
                Edit
              </Button>
              <Button size="sm" onClick={() => onPublish(article)}>
                <FileText className="mr-2 h-4 w-4" />
                Publish
              </Button>
            </div>
          </div>
        ))}
      </div>
      {draftArticles.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-40" />
          <h3 className="text-lg font-medium mb-2">No draft articles</h3>
          <p className="text-sm">
            All your articles are published. Create a new draft to get started.
          </p>
        </div>
      )}
    </div>
  );
}
