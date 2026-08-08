"use client";

import React, { useCallback, useRef, useState } from "react";
import { Plus, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface UploadDropzoneProps {
  isUploading: boolean;
  hasFiles: boolean;
  onFilesSelected: (files: File[]) => void;
  children?: React.ReactNode;
}

export default function UploadDropzone({
  isUploading,
  hasFiles,
  onFilesSelected,
  children,
}: UploadDropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

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

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      const droppedFiles = e.dataTransfer.files;
      if (droppedFiles) {
        onFilesSelected(Array.from(droppedFiles));
      }
    },
    [onFilesSelected],
  );

  return (
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
        onChange={(e) => {
          if (e.target.files) {
            onFilesSelected(Array.from(e.target.files));
          }
        }}
        className="hidden"
        disabled={isUploading}
      />

      {hasFiles ? (
        children
      ) : (
        <div className="text-center py-12">
          <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="text-lg font-medium mb-2">Drag & Drop files here</p>
          <p className="text-sm text-gray-600 mb-4">or click to browse from your computer</p>
          <Button onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
            <Plus className="h-4 w-4 mr-2" />
            Select Files
          </Button>
        </div>
      )}
    </div>
  );
}
