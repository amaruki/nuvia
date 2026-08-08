"use client";

import { AlertTriangle, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatFileSize, getFileType, getMediaIcon } from "./helpers";
import type { UploadFile } from "./types";

interface FilePreviewListProps {
  files: UploadFile[];
  isUploading: boolean;
  onRemove: (id: string) => void;
}

export default function FilePreviewList({ files, isUploading, onRemove }: FilePreviewListProps) {
  return (
    <div className="max-h-60 overflow-y-auto space-y-2">
      {files.map((file) => {
        const Icon = getMediaIcon(file.file.type);

        return (
          <Card key={file.id} className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="text-blue-600">
                  <Icon className="h-8 w-8" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{file.file.name}</p>
                  <p className="text-sm text-gray-600">
                    {formatFileSize(file.file.size)} • {getFileType(file.file)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {file.status === "success" && <Check className="h-4 w-4 text-green-600" />}
                {file.status === "error" && <AlertTriangle className="h-4 w-4 text-red-600" />}
                {file.status === "uploading" && (
                  <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full" />
                )}
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemove(file.id)}
                disabled={isUploading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Progress Bar for individual file */}
            {file.status === "uploading" && (
              <div className="mt-2">
                <Progress value={file.progress} className="w-full" />
              </div>
            )}

            {/* Error Message */}
            {file.status === "error" && (
              <div className="mt-2 text-sm text-red-600">{file.error || "Upload failed"}</div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
