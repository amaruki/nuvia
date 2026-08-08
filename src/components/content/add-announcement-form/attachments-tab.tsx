import { Plus, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TabsContent } from "@/components/ui/tabs";

import type { Attachment } from "@/types/announcement";

interface NewAttachment {
  name: string;
  url: string;
  type: "document";
}

interface AttachmentsTabProps {
  attachments: Attachment[];
  newAttachment: NewAttachment;
  onNewAttachmentChange: (value: NewAttachment) => void;
  onAddAttachment: () => void;
  onRemoveAttachment: (id: string) => void;
}

export function AttachmentsTab({
  attachments,
  newAttachment,
  onNewAttachmentChange,
  onAddAttachment,
  onRemoveAttachment,
}: AttachmentsTabProps) {
  return (
    <TabsContent value="attachments" className="space-y-4">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Attachment name"
            value={newAttachment.name}
            onChange={(e) => onNewAttachmentChange({ ...newAttachment, name: e.target.value })}
          />
          <Input
            placeholder="Attachment URL"
            value={newAttachment.url}
            onChange={(e) => onNewAttachmentChange({ ...newAttachment, url: e.target.value })}
          />
          <Button type="button" onClick={onAddAttachment} size="sm">
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {attachments.length > 0 && (
          <div className="space-y-2">
            <Label>Current Attachments</Label>
            <div className="space-y-2">
              {attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="flex items-center justify-between p-2 border rounded"
                >
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{attachment.type}</Badge>
                    <span className="text-sm">{attachment.name}</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveAttachment(attachment.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </TabsContent>
  );
}
