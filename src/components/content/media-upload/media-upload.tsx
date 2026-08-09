"use client";

import { useCallback, useState } from "react";
import { Loader2, Trash2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/logger";
import type { MediaUploadOptions, MediaVisibility } from "@/types/media";
import FilePreviewList from "./file-preview-list";
import { formatFileSize } from "./helpers";
import type { MediaUploadProps, UploadFile } from "./types";
import UploadDropzone from "./upload-dropzone";
import UploadProgress from "./upload-progress";

export function MediaUpload({ onUpload, onClose, className }: MediaUploadProps) {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [uploadOptions, setUploadOptions] = useState<MediaUploadOptions>({
    visibility: "private",
    generateThumbnail: true,
    generatePreview: true,
    extractMetadata: true,
  });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFilesSelected = useCallback((selectedFiles: File[]) => {
    const newFiles: UploadFile[] = selectedFiles.map((file) => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      progress: 0,
      status: "pending",
    }));

    setFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((file) => file.id !== id));
  };

  const simulateUpload = async () => {
    setIsUploading(true);
    setUploadProgress(0);

    const validFiles = files.filter((f) => f.status !== "error");

    try {
      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i];

        // Update file status to uploading
        setFiles((prev) => prev.map((f) => (f.id === file.id ? { ...f, status: "uploading" } : f)));

        // Simulate upload progress
        for (let progress = 0; progress <= 100; progress += 10) {
          await new Promise((resolve) => setTimeout(resolve, 100));
          setUploadProgress(progress);
          setFiles((prev) => prev.map((f) => (f.id === file.id ? { ...f, progress } : f)));
        }

        // Mark as success
        setFiles((prev) =>
          prev.map((f) => (f.id === file.id ? { ...f, status: "success", progress: 100 } : f)),
        );
      }

      // Call the upload handler
      await onUpload(
        validFiles.map((f) => f.file),
        uploadOptions,
      );

      // Reset after successful upload
      setTimeout(() => {
        setFiles([]);
        setUploadProgress(0);
        setIsUploading(false);
      }, 1000);
    } catch (error) {
      logger.error("Upload failed", error);
      setFiles((prev) =>
        prev.map((f) =>
          f.status === "uploading" ? { ...f, status: "error", error: "Upload failed" } : f,
        ),
      );
      setIsUploading(false);
    }
  };

  const clearFiles = () => {
    setFiles([]);
  };

  const totalSize = files.reduce((sum, file) => sum + file.file.size, 0);
  const validFiles = files.filter((f) => f.status !== "error");
  const hasErrors = files.some((f) => f.status === "error");

  return (
    <div
      className={cn("fixed inset-0 bg-black/50 flex items-center justify-center z-50", className)}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <Upload className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold">Upload Media</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isUploading}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Upload Options */}
        <div className="p-6 border-b space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="media-upload-visibility" className="block text-sm font-medium mb-2">
                Visibility
              </Label>
              <Select
                value={uploadOptions.visibility}
                onValueChange={(value) =>
                  setUploadOptions((prev) => ({ ...prev, visibility: value as MediaVisibility }))
                }
                disabled={isUploading}
              >
                <SelectTrigger id="media-upload-visibility" className="mt-1 w-full">
                  <SelectValue placeholder="Select visibility" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                  <SelectItem value="restricted">Restricted</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <fieldset>
              <legend className="text-sm font-medium mb-2">Options</legend>

              <div className="mt-2 space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="media-upload-generate-thumbnail"
                    checked={uploadOptions.generateThumbnail}
                    onCheckedChange={(checked) =>
                      setUploadOptions((prev) => ({
                        ...prev,
                        generateThumbnail: checked === true,
                      }))
                    }
                    disabled={isUploading}
                  />
                  <Label htmlFor="media-upload-generate-thumbnail" className="text-sm font-normal">
                    Generate thumbnail
                  </Label>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="media-upload-generate-preview"
                    checked={uploadOptions.generatePreview}
                    onCheckedChange={(checked) =>
                      setUploadOptions((prev) => ({
                        ...prev,
                        generatePreview: checked === true,
                      }))
                    }
                    disabled={isUploading}
                  />
                  <Label htmlFor="media-upload-generate-preview" className="text-sm font-normal">
                    Generate preview
                  </Label>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="media-upload-extract-metadata"
                    checked={uploadOptions.extractMetadata}
                    onCheckedChange={(checked) =>
                      setUploadOptions((prev) => ({
                        ...prev,
                        extractMetadata: checked === true,
                      }))
                    }
                    disabled={isUploading}
                  />
                  <Label htmlFor="media-upload-extract-metadata" className="text-sm font-normal">
                    Extract metadata
                  </Label>
                </div>
              </div>
            </fieldset>
          </div>
        </div>

        {/* Drop Zone */}
        <UploadDropzone
          isUploading={isUploading}
          hasFiles={files.length > 0}
          onFilesSelected={handleFilesSelected}
        >
          <div className="space-y-4">
            {/* Upload Progress */}
            {isUploading && <UploadProgress progress={uploadProgress} />}

            {/* File List */}
            <FilePreviewList files={files} isUploading={isUploading} onRemove={removeFile} />

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="text-sm text-gray-600">
                {files.length} files • {formatFileSize(totalSize)}
                {hasErrors && <span className="text-red-600 ml-2">• Some files have errors</span>}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={clearFiles} disabled={isUploading}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear All
                </Button>

                <Button
                  onClick={simulateUpload}
                  disabled={validFiles.length === 0 || isUploading}
                  className="min-w-32"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload {validFiles.length} File{validFiles.length !== 1 ? "s" : ""}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </UploadDropzone>
      </div>
    </div>
  );
}
