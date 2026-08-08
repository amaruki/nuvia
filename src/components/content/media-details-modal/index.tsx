"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X, Download, Share2, Edit, Trash2 } from "lucide-react";
import type { MediaVersion } from "@/types/media";
import type { MediaDetailsModalProps } from "./types";
import { getMediaIcon } from "./helpers";
import { getMockVersions, getMockUsage, getMockPermissions } from "./mock-data";
import DetailsTab from "./details-tab";
import PreviewTab from "./preview-tab";
import VersionsTab from "./versions-tab";
import UsageTab from "./usage-tab";
import PermissionsTab from "./permissions-tab";

export function MediaDetailsModal({
  media,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onDownload,
  onShare,
  onVersionRestore,
}: MediaDetailsModalProps) {
  const [activeTab, setActiveTab] = useState("details");
  const [selectedVersion, setSelectedVersion] = useState<MediaVersion | null>(null);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [rotation, setRotation] = useState(0);

  const mockVersions = getMockVersions(media);
  const mockUsage = getMockUsage(media);
  const mockPermissions = getMockPermissions(media);

  useEffect(() => {
    if (media && mockVersions.length > 0) {
      setSelectedVersion(mockVersions[0]);
    }
  }, [media]);

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 25, 50));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);
  const handleReset = () => {
    setZoomLevel(100);
    setRotation(0);
  };

  if (!media) return null;

  const Icon = getMediaIcon(media.metadata.mimeType);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <DialogTitle className="flex items-center gap-3">
            <div className="text-blue-600">
              <Icon className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold truncate">{media.title}</h2>
              <p className="text-sm text-gray-600">{media.metadata.fileName}</p>
            </div>
          </DialogTitle>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => onDownload?.(media)}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>

            <Button variant="outline" size="sm" onClick={() => onShare?.(media)}>
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>

            <Button variant="outline" size="sm" onClick={() => onEdit?.(media)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete?.(media.id)}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>

            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="versions">Versions</TabsTrigger>
            <TabsTrigger value="usage">Usage</TabsTrigger>
            <TabsTrigger value="permissions">Permissions</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto">
            <DetailsTab media={media} />
            <PreviewTab
              media={media}
              zoomLevel={zoomLevel}
              rotation={rotation}
              onZoomIn={handleZoomIn}
              onZoomOut={handleZoomOut}
              onRotate={handleRotate}
              onReset={handleReset}
              onDownload={onDownload}
            />
            <VersionsTab
              media={media}
              versions={mockVersions}
              selectedVersion={selectedVersion}
              onSelectVersion={setSelectedVersion}
              onVersionRestore={onVersionRestore}
            />
            <UsageTab usageItems={mockUsage} />
            <PermissionsTab permissions={mockPermissions} />
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

export default MediaDetailsModal;
