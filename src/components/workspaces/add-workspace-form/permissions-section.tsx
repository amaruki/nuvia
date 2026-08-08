import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CommitteeRole, Permission } from "@/types/committee.types";
import { Plus, Trash2 } from "lucide-react";
import { roleOptions, permissionOptions } from "./options";
import { WorkspaceForm } from "./types";

interface PermissionsSectionProps {
  form: WorkspaceForm;
}

export function PermissionsSection({ form }: PermissionsSectionProps) {
  const handleAddPermissionSet = () => {
    const currentPermissions = form.getValues("settings.memberPermissions") || [];
    form.setValue("settings.memberPermissions", [
      ...currentPermissions,
      {
        role: "member",
        permissions: ["view", "download"],
      },
    ]);
  };

  const handleRemovePermissionSet = (index: number) => {
    const currentPermissions = form.getValues("settings.memberPermissions") || [];
    form.setValue(
      "settings.memberPermissions",
      currentPermissions.filter((_, i) => i !== index),
    );
  };

  const handlePermissionToggle = (permissionIndex: number, permission: Permission) => {
    const currentPermissions = form.getValues("settings.memberPermissions") || [];
    const permissionSet = currentPermissions[permissionIndex];

    if (permissionSet) {
      const updatedPermissions = permissionSet.permissions.includes(permission)
        ? permissionSet.permissions.filter((p) => p !== permission)
        : [...permissionSet.permissions, permission];

      form.setValue("settings.memberPermissions", [
        ...currentPermissions.slice(0, permissionIndex),
        { ...permissionSet, permissions: updatedPermissions },
        ...currentPermissions.slice(permissionIndex + 1),
      ]);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Member Permissions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          {form.watch("settings.memberPermissions")?.map((permissionSet, index) => (
            <div key={index} className="p-4 border rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Select
                    value={permissionSet.role}
                    onValueChange={(value) => {
                      const current = form.getValues("settings.memberPermissions") || [];
                      form.setValue("settings.memberPermissions", [
                        ...current.slice(0, index),
                        { ...permissionSet, role: value as CommitteeRole },
                        ...current.slice(index + 1),
                      ]);
                    }}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {roleOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleRemovePermissionSet(index)}
                  disabled={form.watch("settings.memberPermissions")?.length <= 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
                {permissionOptions.map((permission) => (
                  <div key={permission.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`permission-${index}-${permission.value}`}
                      checked={permissionSet.permissions.includes(permission.value)}
                      onCheckedChange={() => handlePermissionToggle(index, permission.value)}
                    />
                    <Label
                      htmlFor={`permission-${index}-${permission.value}`}
                      className="text-sm font-normal cursor-pointer"
                      title={permission.description}
                    >
                      {permission.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            onClick={handleAddPermissionSet}
            className="w-full"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Permission Set
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
