"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TabsContent } from "@/components/ui/tabs";
import { User, Calendar, Clock, HardDrive, Eye, Download, Copy } from "lucide-react";
import type { Media } from "@/types/media";
import { formatFileSize, getVisibilityIcon, copyToClipboard } from "./helpers";

interface DetailsTabProps {
  media: Media;
}

export default function DetailsTab({ media }: DetailsTabProps) {
  return (
    <TabsContent value="details" className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Title</span>
              <span className="text-sm">{media.title}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Description</span>
              <span className="text-sm text-right max-w-xs truncate">
                {media.description || "No description"}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">File Name</span>
              <span className="text-sm">{media.metadata.fileName}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">File Size</span>
              <span className="text-sm">{formatFileSize(media.metadata.size)}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Type</span>
              <Badge variant="secondary">{media.type}</Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Visibility</span>
              <div className="flex items-center gap-2">
                {getVisibilityIcon(media.visibility)}
                <Badge variant={media.visibility === "public" ? "default" : "secondary"}>
                  {media.visibility}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Metadata */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Metadata</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Created By</span>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span className="text-sm">{media.createdBy}</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Created At</span>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span className="text-sm">{media.createdAt.toLocaleDateString()}</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Last Modified</span>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span className="text-sm">{media.updatedAt.toLocaleDateString()}</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Storage Location</span>
              <div className="flex items-center gap-2">
                <HardDrive className="h-4 w-4" />
                <span className="text-sm">{media.storageType}</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Views</span>
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                <span className="text-sm">
                  {media.analytics.reduce((sum, a) => sum + a.views, 0)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Downloads</span>
              <div className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                <span className="text-sm">
                  {media.analytics.reduce((sum, a) => sum + a.downloads, 0)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tags */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Tags</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {media.tags.length > 0 ? (
                media.tags.map((tag, index) => (
                  <Badge key={index} variant="outline">
                    {tag.name}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-gray-500">No tags assigned</span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* URLs */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">URLs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Media URL</p>
                <p className="text-xs text-gray-600 truncate">{media.url}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => copyToClipboard(media.url)}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>

            {media.thumbnailUrl && (
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">Thumbnail URL</p>
                  <p className="text-xs text-gray-600 truncate">{media.thumbnailUrl}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(media.thumbnailUrl || "")}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </TabsContent>
  );
}
