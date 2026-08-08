import { useState } from "react";
import { Button } from "@/components/ui/button";
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
import { Building, Plus, Shield, User, Users2 } from "lucide-react";
import type {
  AddPermissionDialogProps,
  PermissionAction,
  PermissionEntityType,
  PermissionFormData,
} from "./types";
import { PERMISSION_OPTIONS } from "./options";
import { getEntityOptions } from "./mock-data";

const INITIAL_FORM_DATA: PermissionFormData = {
  entityType: "user",
  entityId: "",
  entityName: "",
  permissions: ["view"],
  expiresAt: undefined,
};

export function AddPermissionDialog({ open, onOpenChange, onAdd }: AddPermissionDialogProps) {
  const [formData, setFormData] = useState<PermissionFormData>(INITIAL_FORM_DATA);

  const handleAddPermission = () => {
    if (!formData.entityId || formData.permissions.length === 0) return;

    onAdd(formData);

    // Reset form
    setFormData(INITIAL_FORM_DATA);
    onOpenChange(false);
  };

  const handlePermissionToggle = (permission: PermissionAction, checked: boolean) => {
    if (checked) {
      setFormData((prev) => ({
        ...prev,
        permissions: [...prev.permissions, permission],
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        permissions: prev.permissions.filter((p) => p !== permission),
      }));
    }
  };

  const handleEntitySelect = (
    entityType: PermissionEntityType,
    entityId: string,
    entityName: string,
  ) => {
    setFormData((prev) => ({
      ...prev,
      entityType,
      entityId,
      entityName,
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
                  entityType: value as PermissionEntityType,
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
              Select {formData.entityType.charAt(0).toUpperCase() + formData.entityType.slice(1)}
            </Label>
            <Select
              value={formData.entityId}
              onValueChange={(value) => {
                const entity = getEntityOptions(formData.entityType).find((e) => e.id === value);
                if (entity) {
                  handleEntitySelect(formData.entityType, entity.id, entity.name);
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder={`Choose a ${formData.entityType}...`} />
              </SelectTrigger>
              <SelectContent>
                {getEntityOptions(formData.entityType).map((entity) => (
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
              {PERMISSION_OPTIONS.map((perm) => (
                <div key={perm.id} className="flex items-start space-x-3">
                  <Checkbox
                    id={perm.id}
                    checked={formData.permissions.includes(perm.id)}
                    onCheckedChange={(checked) => handlePermissionToggle(perm.id, !!checked)}
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
              value={formData.expiresAt ? formData.expiresAt.toISOString().slice(0, 16) : ""}
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
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddPermission}>Add Permission</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
