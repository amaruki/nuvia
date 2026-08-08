"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Users,
  User,
  Shield,
  Eye,
  Download,
  Edit,
  Trash2,
  Share2,
  Plus,
  X,
  Calendar,
  Clock,
  Search,
  Filter,
  MoreVertical,
  Settings,
  Lock,
  Globe,
  UserCheck,
  Building,
  Users2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Media, MediaPermission } from "@/types/media";

interface MediaPermissionsManagerProps {
  media: Media | null;
  isOpen: boolean;
  onClose: () => void;
  onPermissionsUpdate?: (mediaId: string, permissions: MediaPermission[]) => void;
}

interface PermissionFormData {
  entityType: "user" | "role" | "chapter" | "committee";
  entityId: string;
  entityName: string;
  permissions: ("view" | "download" | "edit" | "delete" | "share")[];
  expiresAt?: Date;
}

export function MediaPermissionsManager({
  media,
  isOpen,
  onClose,
  onPermissionsUpdate,
}: MediaPermissionsManagerProps) {
  const [permissions, setPermissions] = useState<MediaPermission[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingPermission, setEditingPermission] = useState<MediaPermission | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [formData, setFormData] = useState<PermissionFormData>({
    entityType: "user",
    entityId: "",
    entityName: "",
    permissions: ["view"],
    expiresAt: undefined,
  });

  // Mock data for users, roles, chapters, committees
  const mockUsers = [
    { id: "user-1", name: "John Doe", email: "john@example.com", avatar: "" },
    { id: "user-2", name: "Jane Smith", email: "jane@example.com", avatar: "" },
    { id: "user-3", name: "Mike Johnson", email: "mike@example.com", avatar: "" },
    { id: "user-4", name: "Sarah Wilson", email: "sarah@example.com", avatar: "" },
  ];

  const mockRoles = [
    { id: "role-1", name: "Admin", description: "Full system access" },
    { id: "role-2", name: "Content Editor", description: "Can edit content" },
    { id: "role-3", name: "Member", description: "Regular member access" },
    { id: "role-4", name: "Viewer", description: "Read-only access" },
  ];

  const mockChapters = [
    { id: "chapter-1", name: "New York Chapter", location: "New York, NY" },
    { id: "chapter-2", name: "Los Angeles Chapter", location: "Los Angeles, CA" },
    { id: "chapter-3", name: "Chicago Chapter", location: "Chicago, IL" },
  ];

  const mockCommittees = [
    { id: "committee-1", name: "Events Committee", description: "Organizes events" },
    { id: "committee-2", name: "Finance Committee", description: "Manages finances" },
    { id: "committee-3", name: "Membership Committee", description: "Handles membership" },
  ];

  useEffect(() => {
    if (media) {
      setPermissions(media.permissions);
    }
  }, [media]);

  const getEntityTypeIcon = (entityType: string) => {
    switch (entityType) {
      case "user":
        return <User className="h-4 w-4" />;
      case "role":
        return <Shield className="h-4 w-4" />;
      case "chapter":
        return <Building className="h-4 w-4" />;
      case "committee":
        return <Users2 className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  const getPermissionIcon = (permission: string) => {
    switch (permission) {
      case "view":
        return <Eye className="h-3 w-3" />;
      case "download":
        return <Download className="h-3 w-3" />;
      case "edit":
        return <Edit className="h-3 w-3" />;
      case "delete":
        return <Trash2 className="h-3 w-3" />;
      case "share":
        return <Share2 className="h-3 w-3" />;
      default:
        return <Lock className="h-3 w-3" />;
    }
  };

  const getPermissionColor = (permission: string) => {
    switch (permission) {
      case "view":
        return "bg-blue-100 text-blue-800";
      case "download":
        return "bg-green-100 text-green-800";
      case "edit":
        return "bg-yellow-100 text-yellow-800";
      case "delete":
        return "bg-red-100 text-red-800";
      case "share":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleAddPermission = () => {
    if (!media || !formData.entityId || formData.permissions.length === 0) return;

    const newPermission: MediaPermission = {
      id: `perm-${Date.now()}`,
      mediaId: media.id,
      entityType: formData.entityType,
      entityId: formData.entityId,
      entityName: formData.entityName,
      permissions: formData.permissions,
      grantedBy: "Current User",
      grantedAt: new Date(),
      expiresAt: formData.expiresAt,
    };

    const updatedPermissions = [...permissions, newPermission];
    setPermissions(updatedPermissions);
    onPermissionsUpdate?.(media.id, updatedPermissions);

    // Reset form
    setFormData({
      entityType: "user",
      entityId: "",
      entityName: "",
      permissions: ["view"],
      expiresAt: undefined,
    });
    setIsAddDialogOpen(false);
  };

  const handleUpdatePermission = () => {
    if (!media || !editingPermission) return;

    const updatedPermissions = permissions.map((p) =>
      p.id === editingPermission.id ? editingPermission : p,
    );
    setPermissions(updatedPermissions);
    onPermissionsUpdate?.(media.id, updatedPermissions);

    setEditingPermission(null);
  };

  const handleDeletePermission = (permissionId: string) => {
    if (!media) return;

    const updatedPermissions = permissions.filter((p) => p.id !== permissionId);
    setPermissions(updatedPermissions);
    onPermissionsUpdate?.(media.id, updatedPermissions);
  };

  const handlePermissionToggle = (permission: string, checked: boolean) => {
    if (checked) {
      setFormData((prev) => ({
        ...prev,
        permissions: [...prev.permissions, permission as any],
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        permissions: prev.permissions.filter((p) => p !== permission),
      }));
    }
  };

  const handleEntitySelect = (entityType: string, entityId: string, entityName: string) => {
    setFormData((prev) => ({
      ...prev,
      entityType: entityType as any,
      entityId,
      entityName,
    }));
  };

  const filteredPermissions = permissions.filter((permission) => {
    const matchesSearch = permission.entityName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === "all" || permission.entityType === filterType;
    return matchesSearch && matchesFilter;
  });

  const getEntityOptions = () => {
    switch (formData.entityType) {
      case "user":
        return mockUsers;
      case "role":
        return mockRoles;
      case "chapter":
        return mockChapters;
      case "committee":
        return mockCommittees;
      default:
        return [];
    }
  };

  if (!media) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <DialogTitle className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold">Media Permissions</h2>
              <p className="text-sm text-gray-600">{media.title}</p>
            </div>
          </DialogTitle>

          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6">
          {/* Search and Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Search & Filter</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search permissions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-48">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="user">Users</SelectItem>
                    <SelectItem value="role">Roles</SelectItem>
                    <SelectItem value="chapter">Chapters</SelectItem>
                    <SelectItem value="committee">Committees</SelectItem>
                  </SelectContent>
                </Select>

                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Permission
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Add New Permission</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-6">
                      {/* Entity Type Selection */}
                      <div>
                        <Label>Entity Type</Label>
                        <Select
                          value={formData.entityType}
                          onValueChange={(value) =>
                            setFormData((prev) => ({
                              ...prev,
                              entityType: value as any,
                              entityId: "",
                              entityName: "",
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4" />
                                User
                              </div>
                            </SelectItem>
                            <SelectItem value="role">
                              <div className="flex items-center gap-2">
                                <Shield className="h-4 w-4" />
                                Role
                              </div>
                            </SelectItem>
                            <SelectItem value="chapter">
                              <div className="flex items-center gap-2">
                                <Building className="h-4 w-4" />
                                Chapter
                              </div>
                            </SelectItem>
                            <SelectItem value="committee">
                              <div className="flex items-center gap-2">
                                <Users2 className="h-4 w-4" />
                                Committee
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Entity Selection */}
                      <div>
                        <Label>
                          Select{" "}
                          {formData.entityType.charAt(0).toUpperCase() +
                            formData.entityType.slice(1)}
                        </Label>
                        <Select
                          value={formData.entityId}
                          onValueChange={(value) => {
                            const entity = getEntityOptions().find((e) => e.id === value);
                            if (entity) {
                              handleEntitySelect(formData.entityType, entity.id, entity.name);
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={`Choose a ${formData.entityType}...`} />
                          </SelectTrigger>
                          <SelectContent>
                            {getEntityOptions().map((entity) => (
                              <SelectItem key={entity.id} value={entity.id}>
                                {entity.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Permissions Selection */}
                      <div>
                        <Label>Permissions</Label>
                        <div className="space-y-3 mt-2">
                          {[
                            { id: "view", label: "View", description: "Can view the media file" },
                            {
                              id: "download",
                              label: "Download",
                              description: "Can download the media file",
                            },
                            { id: "edit", label: "Edit", description: "Can edit media metadata" },
                            {
                              id: "delete",
                              label: "Delete",
                              description: "Can delete the media file",
                            },
                            { id: "share", label: "Share", description: "Can share with others" },
                          ].map((perm) => (
                            <div key={perm.id} className="flex items-start space-x-3">
                              <Checkbox
                                id={perm.id}
                                checked={formData.permissions.includes(perm.id as any)}
                                onCheckedChange={(checked) =>
                                  handlePermissionToggle(perm.id, !!checked)
                                }
                              />
                              <div className="flex-1">
                                <Label htmlFor={perm.id} className="font-medium">
                                  {perm.label}
                                </Label>
                                <p className="text-sm text-gray-600">{perm.description}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Expiration */}
                      <div>
                        <Label>Expiration (Optional)</Label>
                        <Input
                          type="datetime-local"
                          value={
                            formData.expiresAt ? formData.expiresAt.toISOString().slice(0, 16) : ""
                          }
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              expiresAt: e.target.value ? new Date(e.target.value) : undefined,
                            }))
                          }
                        />
                      </div>

                      {/* Actions */}
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleAddPermission}>Add Permission</Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>

          {/* Permissions List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Current Permissions ({filteredPermissions.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredPermissions.length > 0 ? (
                <div className="space-y-4">
                  {filteredPermissions.map((permission) => (
                    <div key={permission.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            {getEntityTypeIcon(permission.entityType)}
                            <div>
                              <p className="font-medium">{permission.entityName}</p>
                              <p className="text-sm text-gray-600 capitalize">
                                {permission.entityType}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {permission.permissions.map((perm) => (
                              <Badge
                                key={perm}
                                variant="secondary"
                                className={cn("text-xs", getPermissionColor(perm))}
                              >
                                <div className="flex items-center gap-1">
                                  {getPermissionIcon(perm)}
                                  {perm}
                                </div>
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingPermission(permission)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeletePermission(permission.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Granted {permission.grantedAt.toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          By {permission.grantedBy}
                        </div>
                        {permission.expiresAt && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Expires {permission.expiresAt.toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Shield className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-lg font-medium mb-2">No permissions found</p>
                  <p className="text-sm text-gray-600 mb-4">
                    {searchTerm || filterType !== "all"
                      ? "Try adjusting your search or filters"
                      : "Add permissions to control who can access this media"}
                  </p>
                  {!searchTerm && filterType === "all" && (
                    <Button onClick={() => setIsAddDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Permission
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Default Permissions Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Default Permissions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Globe className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium">Public Access</p>
                    <p className="text-sm text-gray-600">
                      Anyone can view and download this media file
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Lock className="h-5 w-5 text-red-600" />
                  <div>
                    <p className="font-medium">Private Access</p>
                    <p className="text-sm text-gray-600">Only you can access this media file</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-amber-600" />
                  <div>
                    <p className="font-medium">Restricted Access</p>
                    <p className="text-sm text-gray-600">
                      Only specific users/roles can access this media file
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
