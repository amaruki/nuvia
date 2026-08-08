"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Shield, X } from "lucide-react";
import type { MediaPermission } from "@/types/media";
import type { MediaPermissionsManagerProps, PermissionFormData } from "./types";
import { SearchFilterCard } from "./search-filter-card";
import { PermissionsListCard } from "./permissions-list-card";
import { DefaultPermissionsCard } from "./default-permissions-card";

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

  useEffect(() => {
    if (media) {
      setPermissions(media.permissions);
    }
  }, [media]);

  const handleAddPermission = (formData: PermissionFormData) => {
    if (!media) return;

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

  const filteredPermissions = permissions.filter((permission) => {
    const matchesSearch = permission.entityName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === "all" || permission.entityType === filterType;
    return matchesSearch && matchesFilter;
  });

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
          <SearchFilterCard
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            filterType={filterType}
            onFilterChange={setFilterType}
            isAddDialogOpen={isAddDialogOpen}
            onAddDialogOpenChange={setIsAddDialogOpen}
            onAddPermission={handleAddPermission}
          />

          <PermissionsListCard
            permissions={filteredPermissions}
            searchTerm={searchTerm}
            filterType={filterType}
            onEdit={setEditingPermission}
            onDelete={handleDeletePermission}
            onAddFirst={() => setIsAddDialogOpen(true)}
          />

          <DefaultPermissionsCard />
        </div>
      </DialogContent>
    </Dialog>
  );
}
