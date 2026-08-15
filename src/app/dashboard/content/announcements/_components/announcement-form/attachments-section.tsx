"use client";

import { Plus, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import type { AttachmentsSectionProps } from "./types";

/**
 * Attachment links, carried over from the legacy form: attachments are
 * local sheet state (not a zod field) merged into the payload on submit.
 */
export function AttachmentsSection({
  attachments,
  newAttachment,
  onNewAttachmentChange,
  onAddAttachment,
  onRemoveAttachment,
}: AttachmentsSectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Input
          placeholder="Attachment name"
          value={newAttachment.name}
          onChange={(event) =>
            onNewAttachmentChange({ ...newAttachment, name: event.target.value })
          }
        />
        <Input
          placeholder="Attachment URL"
          value={newAttachment.url}
          onChange={(event) => onNewAttachmentChange({ ...newAttachment, url: event.target.value })}
        />
        <Button type="button" onClick={onAddAttachment} size="sm">
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {attachments.length > 0 && (
        <div className="space-y-2">
          <Label>Current attachments</Label>
          <div className="space-y-2">
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="flex items-center justify-between rounded border p-2"
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
  );
}
