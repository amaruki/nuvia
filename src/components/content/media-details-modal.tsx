"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  X, 
  Download, 
  Share2, 
  Edit, 
  Trash2, 
  Eye, 
  Copy,
  Calendar,
  User,
  FileText,
  Image as ImageIcon,
  Video,
  Music,
  Archive,
  Clock,
  HardDrive,
  Globe,
  Lock,
  Users,
  History,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCw,
  DownloadCloud,
  Link,
  Settings
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Media, MediaVersion, MediaUsage, MediaPermission } from "@/types/media.types";

interface MediaDetailsModalProps {
  media: Media | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (media: Media) => void;
  onDelete?: (mediaId: string) => void;
  onDownload?: (media: Media) => void;
  onShare?: (media: Media) => void;
  onVersionRestore?: (mediaId: string, versionId: string) => void;
}

export function MediaDetailsModal({ 
  media, 
  isOpen, 
  onClose, 
  onEdit,
  onDelete,
  onDownload,
  onShare,
  onVersionRestore
}: MediaDetailsModalProps) {
  const [activeTab, setActiveTab] = useState("details");
  const [selectedVersion, setSelectedVersion] = useState<MediaVersion | null>(null);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [rotation, setRotation] = useState(0);

  // Mock data for versions, usage, and permissions
  const mockVersions: MediaVersion[] = media ? [
    {
      id: `${media.id}-v3`,
      mediaId: media.id,
      version: 3,
      url: media.url,
      thumbnailUrl: media.thumbnailUrl,
      metadata: media.metadata,
      changelog: "Updated metadata and optimized file size",
      createdBy: "John Doe",
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      isActive: true,
      size: media.metadata.size
    },
    {
      id: `${media.id}-v2`,
      mediaId: media.id,
      version: 2,
      url: media.url,
      thumbnailUrl: media.thumbnailUrl,
      metadata: { ...media.metadata },
      changelog: "Added tags and description",
      createdBy: "Jane Smith",
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      isActive: false,
      size: Math.floor(media.metadata.size * 1.2)
    },
    {
      id: `${media.id}-v1`,
      mediaId: media.id,
      version: 1,
      url: media.url,
      thumbnailUrl: media.thumbnailUrl,
      metadata: { ...media.metadata },
      changelog: "Initial upload",
      createdBy: "Mike Johnson",
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      isActive: false,
      size: Math.floor(media.metadata.size * 1.5)
    }
  ] : [];

  const mockUsage: MediaUsage[] = media ? [
    {
      id: "usage-1",
      mediaId: media.id,
      entityType: "article",
      entityId: "article-1",
      entityTitle: "Getting Started with Our Platform",
      usageType: "featured_image",
      url: media.url,
      addedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      addedBy: "John Doe"
    },
    {
      id: "usage-2",
      mediaId: media.id,
      entityType: "announcement",
      entityId: "announcement-1",
      entityTitle: "Community Update - December 2024",
      usageType: "attachment",
      url: media.url,
      addedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      addedBy: "Jane Smith"
    }
  ] : [];

  const mockPermissions: MediaPermission[] = media ? [
    {
      id: "perm-1",
      mediaId: media.id,
      entityType: "user",
      entityId: "user-1",
      entityName: "John Doe",
      permissions: ["view", "download", "edit"],
      grantedBy: "Admin",
      grantedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    },
    {
      id: "perm-2",
      mediaId: media.id,
      entityType: "role",
      entityId: "role-1",
      entityName: "Content Editors",
      permissions: ["view", "download"],
      grantedBy: "Admin",
      grantedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
    }
  ] : [];

  useEffect(() => {
    if (media && mockVersions.length > 0) {
      setSelectedVersion(mockVersions[0]);
    }
  }, [media]);

  const getMediaIcon = (type: string) => {
    if (type.startsWith('image/')) return ImageIcon;
    if (type.startsWith('video/')) return Video;
    if (type.startsWith('audio/')) return Music;
    if (type.includes('pdf') || type.includes('zip')) return Archive;
    return FileText;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const idx = Math.min(i, sizes.length - 1);
    return `${parseFloat((bytes / Math.pow(k, idx)).toFixed(2))} ${sizes[idx]}`;
  };

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case 'public': return <Globe className="h-4 w-4" />;
      case 'private': return <Lock className="h-4 w-4" />;
      case 'restricted': return <Users className="h-4 w-4" />;
      default: return <Lock className="h-4 w-4" />;
    }
  };

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 25, 50));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);
  const handleReset = () => {
    setZoomLevel(100);
    setRotation(0);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDownload?.(media)}
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onShare?.(media)}
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit?.(media)}
            >
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
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
            >
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
            {/* Details Tab */}
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
                        {media.description || 'No description'}
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
                        <Badge variant={media.visibility === 'public' ? 'default' : 'secondary'}>
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
                        <span className="text-sm">{media.analytics.reduce((sum, a) => sum + a.views, 0)}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Downloads</span>
                      <div className="flex items-center gap-2">
                        <Download className="h-4 w-4" />
                        <span className="text-sm">{media.analytics.reduce((sum, a) => sum + a.downloads, 0)}</span>
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
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(media.url)}
                      >
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
                          onClick={() => copyToClipboard(media.thumbnailUrl || '')}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Preview Tab */}
            <TabsContent value="preview" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Media Preview</CardTitle>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={handleZoomOut}>
                        <ZoomOut className="h-4 w-4" />
                      </Button>
                      <span className="text-sm font-medium w-12 text-center">{zoomLevel}%</span>
                      <Button variant="outline" size="sm" onClick={handleZoomIn}>
                        <ZoomIn className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleRotate}>
                        <RotateCw className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleReset}>
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center min-h-[400px] bg-gray-50 rounded-lg overflow-hidden">
                    {media.type === 'image' ? (
                      <img
                        src={media.url}
                        alt={media.title}
                        className="max-w-full max-h-[600px] object-contain transition-transform"
                        style={{
                          transform: `scale(${zoomLevel / 100}) rotate(${rotation}deg)`,
                        }}
                      />
                    ) : media.type === 'video' ? (
                      <video
                        src={media.url}
                        controls
                        className="max-w-full max-h-[600px]"
                      />
                    ) : media.type === 'audio' ? (
                      <audio
                        src={media.url}
                        controls
                        className="w-full max-w-md"
                      />
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

            {/* Versions Tab */}
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
                    {mockVersions.map((version) => (
                      <div
                        key={version.id}
                        className={cn(
                          "p-4 border rounded-lg cursor-pointer transition-colors",
                          selectedVersion?.id === version.id
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                        )}
                        onClick={() => setSelectedVersion(version)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
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
                                <span className="text-xs text-gray-500">
                                  By {version.createdBy}
                                </span>
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

            {/* Usage Tab */}
            <TabsContent value="usage" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Media Usage</CardTitle>
                </CardHeader>
                <CardContent>
                  {mockUsage.length > 0 ? (
                    <div className="space-y-4">
                      {mockUsage.map((usage) => (
                        <div key={usage.id} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{usage.entityTitle}</p>
                              <div className="flex items-center gap-4 mt-2">
                                <Badge variant="outline">{usage.usageType}</Badge>
                                <span className="text-xs text-gray-500">
                                  Added by {usage.addedBy}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {usage.addedAt.toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p className="text-lg font-medium mb-2">No usage found</p>
                      <p className="text-sm text-gray-600">
                        This media file is not currently used anywhere
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Permissions Tab */}
            <TabsContent value="permissions" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Permissions</CardTitle>
                    <Button variant="outline" size="sm">
                      <Users className="h-4 w-4 mr-2" />
                      Add Permission
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {mockPermissions.length > 0 ? (
                    <div className="space-y-4">
                      {mockPermissions.map((permission) => (
                        <div key={permission.id} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{permission.entityName}</span>
                                <Badge variant="outline">{permission.entityType}</Badge>
                              </div>
                              <div className="flex items-center gap-2 mt-2">
                                {permission.permissions.map((perm, index) => (
                                  <Badge key={index} variant="secondary" className="text-xs">
                                    {perm}
                                  </Badge>
                                ))}
                              </div>
                              <div className="flex items-center gap-4 mt-2">
                                <span className="text-xs text-gray-500">
                                  Granted by {permission.grantedBy}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {permission.grantedAt.toLocaleDateString()}
                                </span>
                                {permission.expiresAt && (
                                  <span className="text-xs text-gray-500">
                                    Expires {permission.expiresAt.toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </div>
                            <Button variant="outline" size="sm">
                              <Settings className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Lock className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p className="text-lg font-medium mb-2">No permissions set</p>
                      <p className="text-sm text-gray-600">
                        This media file uses default permissions
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}