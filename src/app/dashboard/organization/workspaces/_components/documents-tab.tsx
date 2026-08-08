import { FileText } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { TabsContent } from "@/components/ui/tabs";
import type { CommitteeWorkspace } from "@/types/committee";

interface DocumentsTabProps {
  workspaces: CommitteeWorkspace[];
}

export function DocumentsTab({ workspaces }: DocumentsTabProps) {
  return (
    <TabsContent value="documents" className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Document Management Overview</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {workspaces.map((workspace) => (
            <div key={workspace.id} className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium">{workspace.name}</h4>
                <Badge variant="outline">{workspace.documents.length} docs</Badge>
              </div>
              <div className="space-y-2">
                {workspace.documents.slice(0, 3).map((doc) => (
                  <div key={doc.id} className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4 text-blue-500" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{doc.name}</p>
                      <p className="text-muted-foreground truncate">{doc.fileName}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {doc.status}
                    </Badge>
                  </div>
                ))}
                {workspace.documents.length > 3 && (
                  <p className="text-xs text-muted-foreground">
                    +{workspace.documents.length - 3} more documents
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </TabsContent>
  );
}
