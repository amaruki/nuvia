"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TabsContent } from "@/components/ui/tabs";
import { History, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Media, MediaVersion } from "@/types/media";
import { formatFileSize, getMediaIcon } from "./helpers";

interface VersionsTabProps {
  media: Media;
  versions: MediaVersion[];
  selectedVersion: MediaVersion | null;
  onSelectVersion: (version: MediaVersion) => void;
  onVersionRestore?: (mediaId: string, versionId: string) => void;
}

export default function VersionsTab({
  media,
  versions,
  selectedVersion,
  onSelectVersion,
  onVersionRestore,
}: VersionsTabProps) {
  const Icon = getMediaIcon(media.metadata.mimeType);

  return (
    <TabsContent value="versions" className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <History className="h-5 w-5" />
            Version History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {versions.map((version) => (
              <div
                key={version.id}
                className={cn(
                  "p-4 border rounded-lg transition-colors",
                  selectedVersion?.id === version.id
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300",
                )}
              >
                <div className="flex items-center justify-between">
                  <div
                    className="flex items-center gap-3 cursor-pointer"
                    role="button"
                    tabIndex={0}
                    onClick={() => onSelectVersion(version)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onSelectVersion(version);
                      }
                    }}
                  >
                    <div className="text-blue-600">
                      <Icon className="h-8 w-8" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Version {version.version}</span>
                        {version.isActive && (
                          <Badge variant="default" className="text-xs">
                            Current
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{version.changelog}</p>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-xs text-gray-500">By {version.createdBy}</span>
                        <span className="text-xs text-gray-500">
                          {version.createdAt.toLocaleDateString()}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatFileSize(version.size)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {!version.isActive && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onVersionRestore?.(media.id, version.id);
                      }}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Restore
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
}
