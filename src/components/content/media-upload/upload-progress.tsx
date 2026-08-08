"use client";

import { Progress } from "@/components/ui/progress";

interface UploadProgressProps {
  progress: number;
}

export default function UploadProgress({ progress }: UploadProgressProps) {
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">Uploading files...</span>
        <span className="text-sm text-gray-600">{progress}%</span>
      </div>
      <Progress value={progress} className="w-full" />
    </div>
  );
}
