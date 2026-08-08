"use client";

import { FileText, Settings } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Publication } from "@/types/publication.types";

interface DraftsTabProps {
  publications: Publication[];
  onEdit: (publication: Publication) => void;
  onPublish: (publication: Publication) => void;
}

export function DraftsTab({ publications, onEdit, onPublish }: DraftsTabProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Draft Publications</h3>
      <div className="space-y-3">
        {publications
          .filter((p) => p.status === "draft")
          .map((publication) => (
            <div
              key={publication.id}
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <div className="min-w-0 flex-1 mr-2">
                <p className="font-medium">{publication.title}</p>
                <p className="text-xs text-muted-foreground">
                  Last modified: {publication.lastModified.toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => onEdit(publication)}>
                  <Settings className="mr-2 h-4 w-4" />
                  Edit
                </Button>
                <Button size="sm" onClick={() => onPublish(publication)}>
                  <FileText className="mr-2 h-4 w-4" />
                  Publish
                </Button>
              </div>
            </div>
          ))}
      </div>
      {publications.filter((p) => p.status === "draft").length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-40" />
          <h3 className="text-lg font-medium mb-2">No draft publications</h3>
          <p className="text-sm">
            All your publications are published. Create a new draft to get started.
          </p>
        </div>
      )}
    </div>
  );
}
