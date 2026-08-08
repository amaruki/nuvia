"use client";

import React, { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  X,
  FileText,
  Image as ImageIcon,
  Video,
  Music,
  Archive,
  Check,
  AlertTriangle,
  Trash2,
  Plus,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/logger";
import { MediaUploadOptions, MediaType } from "@/types/media";

interface MediaUploadProps {
  onUpload: (files: File[], options: MediaUploadOptions) => Promise<void>;
  onClose: () => void;
  className?: string;
}

interface UploadFile {
  file: File;
  id: string;
  progress: number;
  status: "pending" | "uploading" | "success" | "error";
  error?: string;
}

export function MediaUpload({ onUpload, onClose, className }: MediaUploadProps) {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadOptions, setUploadOptions] = useState<MediaUploadOptions>({
    visibility: "private",
    generateThumbnail: true,
    generatePreview: true,
    extractMetadata: true,
  });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const getMediaIcon = (type: string) => {
    const iconMap = {
      "image/": ImageIcon,
      "video/": Video,
      "audio/": Music,
      "application/pdf": FileText,
      "text/": FileText,
      "application/zip": Archive,
      "application/x-zip-compressed": Archive,
    };

    for (const [mimeType, icon] of Object.entries(iconMap)) {
      if (type.startsWith(mimeType)) {
        return icon;
      }
    }

    return FileText;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const idx = Math.min(i, sizes.length - 1);
    return `${parseFloat((bytes / Math.pow(k, idx)).toFixed(2))} ${sizes[idx]}`;
  };

  const getFileType = (file: File): MediaType => {
    const type = file.type.toLowerCase();

    if (type.startsWith("image/")) return "image";
    if (type.startsWith("video/")) return "video";
    if (type.startsWith("audio/")) return "audio";
    if (type.includes("pdf")) return "pdf";
    if (type.includes("zip") || type.includes("rar") || type.includes("7z")) return "archive";
    if (type.includes("sheet") || type.includes("excel")) return "spreadsheet";
    if (type.includes("presentation") || type.includes("powerpoint")) return "presentation";
    if (type.includes("font")) return "font";
    if (type.includes("svg")) return "vector";

    return "document";
  };

  const handleFileSelect = (selectedFiles: FileList | null) => {
    const files = selectedFiles ? Array.from(selectedFiles) : [];
    if (!selectedFiles) return;

    const newFiles: UploadFile[] = files.map((file) => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      progress: 0,
      status: "pending",
    }));

    setFiles((prev) => [...prev, ...newFiles]);
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const droppedFiles = e.dataTransfer.files;
    handleFileSelect(droppedFiles);
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
              <label htmlFor="media-upload-visibility" className="block text-sm font-medium mb-2">
                Visibility
                <select
                  value={uploadOptions.visibility}
                  onChange={(e) =>
                    setUploadOptions((prev) => ({ ...prev, visibility: e.target.value as any }))
                  }
                  id="media-upload-visibility"
                  className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  disabled={isUploading}
                >
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                  <option value="restricted">Restricted</option>
                  <option value="draft">Draft</option>
                </select>
              </label>
            </div>

            <fieldset>
              <legend className="text-sm font-medium mb-2">Options</legend>

              <div className="mt-2 space-y-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={uploadOptions.generateThumbnail}
                    onChange={(e) =>
                      setUploadOptions((prev) => ({ ...prev, generateThumbnail: e.target.checked }))
                    }
                    disabled={isUploading}
                    className="rounded border-primary"
                  />
                  <span>Generate thumbnail</span>
                </label>

                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={uploadOptions.generatePreview}
                    onChange={(e) =>
                      setUploadOptions((prev) => ({ ...prev, generatePreview: e.target.checked }))
                    }
                    disabled={isUploading}
                    className="rounded border-primary"
                  />
                  <span>Generate preview</span>
                </label>

                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={uploadOptions.extractMetadata}
                    onChange={(e) =>
                      setUploadOptions((prev) => ({ ...prev, extractMetadata: e.target.checked }))
                    }
                    disabled={isUploading}
                    className="rounded border-primary"
                  />
                  <span>Extract metadata</span>
                </label>
              </div>
            </fieldset>
          </div>
        </div>

        {/* Drop Zone */}
        <div
          ref={dropZoneRef}
          className={cn(
            "flex-1 p-6 border-2 border-dashed rounded-lg transition-colors",
            isDragOver ? "border-blue-500 bg-blue-50" : "border-gray-300 bg-gray-50",
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.7z,.svg,.ttf,.otf,.woff,.woff2"
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
            disabled={isUploading}
          />

          {files.length === 0 ? (
            <div className="text-center py-12">
              <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium mb-2">Drag & Drop files here</p>
              <p className="text-sm text-gray-600 mb-4">or click to browse from your computer</p>
              <Button onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                <Plus className="h-4 w-4 mr-2" />
                Select Files
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Upload Progress */}
              {isUploading && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Uploading files...</span>
                    <span className="text-sm text-gray-600">{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="w-full" />
                </div>
              )}

              {/* File List */}
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
                          {file.status === "success" && (
                            <Check className="h-4 w-4 text-green-600" />
                          )}
                          {file.status === "error" && (
                            <AlertTriangle className="h-4 w-4 text-red-600" />
                          )}
                          {file.status === "uploading" && (
                            <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full" />
                          )}
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(file.id)}
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
                        <div className="mt-2 text-sm text-red-600">
                          {file.error || "Upload failed"}
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>

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
                        <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
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
          )}
        </div>
      </div>
    </div>
  );
}
