import { formatDistanceToNow } from "date-fns";
import { FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";
import { CommitteeWorkspace } from "@/types/committee.types";
import { getDocumentStatusBadge } from "./status-badges";

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

interface DocumentsTabProps {
  workspace: CommitteeWorkspace;
}

export function DocumentsTab({ workspace }: DocumentsTabProps) {
  return (
    <TabsContent value="documents" className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Workspace Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {workspace.documents.map((document) => (
              <div
                key={document.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
                    <FileText className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{document.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {document.fileName} • {formatFileSize(document.fileSize)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Uploaded {formatDistanceToNow(document.uploadedAt, { addSuffix: true })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {document.fileType}
                    </Badge>
                    {getDocumentStatusBadge(document.status)}
                  </div>
                </div>
              </div>
            ))}
            {workspace.documents.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No documents in this workspace yet</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
}
