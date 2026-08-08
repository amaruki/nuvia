"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";
import { Download, ZoomIn, ZoomOut, RotateCw, Settings } from "lucide-react";
import type { Media } from "@/types/media";
import { formatFileSize, getMediaIcon } from "./helpers";

interface PreviewTabProps {
  media: Media;
  zoomLevel: number;
  rotation: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onRotate: () => void;
  onReset: () => void;
  onDownload?: (media: Media) => void;
}

export default function PreviewTab({
  media,
  zoomLevel,
  rotation,
  onZoomIn,
  onZoomOut,
  onRotate,
  onReset,
  onDownload,
}: PreviewTabProps) {
  const Icon = getMediaIcon(media.metadata.mimeType);

  return (
    <TabsContent value="preview" className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Media Preview</CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={onZoomOut}>
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium w-12 text-center">{zoomLevel}%</span>
              <Button variant="outline" size="sm" onClick={onZoomIn}>
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={onRotate}>
                <RotateCw className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={onReset}>
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center min-h-[400px] bg-gray-50 rounded-lg overflow-hidden">
            {media.type === "image" ? (
              <img
                src={media.url}
                alt={media.title}
                className="max-w-full max-h-[600px] object-contain transition-transform"
                style={{
                  transform: `scale(${zoomLevel / 100}) rotate(${rotation}deg)`,
                }}
              />
            ) : media.type === "video" ? (
              // oxlint-disable-next-line jsx-a11y/media-has-caption -- uploaded-media preview; caption tracks not supported yet (tracked in docs/accessibility/wcag-2.2-aa-enabled-modules.md)
              <video src={media.url} controls className="max-w-full max-h-[600px]" />
            ) : media.type === "audio" ? (
              // oxlint-disable-next-line jsx-a11y/media-has-caption -- uploaded-media preview; caption tracks not supported yet (tracked in docs/accessibility/wcag-2.2-aa-enabled-modules.md)
              <audio src={media.url} controls className="w-full max-w-md" />
            ) : (
              <div className="text-center p-8">
                <Icon className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium mb-2">{media.title}</p>
                <p className="text-sm text-gray-600 mb-4">
                  {formatFileSize(media.metadata.size)} • {media.type.toUpperCase()}
                </p>
                <Button onClick={() => onDownload?.(media)}>
                  <Download className="h-4 w-4 mr-2" />
                  Download File
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
}
