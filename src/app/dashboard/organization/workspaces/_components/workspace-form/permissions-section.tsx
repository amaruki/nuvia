import { Plus, Trash2 } from "lucide-react";
import { useFormContext } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { WorkspaceFormValues } from "@/lib/validation/organization.validation";
import type { CommitteeRole, Permission } from "@/types/committee";

import { permissionOptions, roleOptions } from "./options";

type PermissionSet = WorkspaceFormValues["settings"]["memberPermissions"][number];

/**
 * Permission sets are a nested field array (role select plus a permission
 * checkbox grid per set), a deliberate shorthand escape hatch, so the whole
 * list composes FormField directly.
 */
export function PermissionsSection() {
  const { control } = useFormContext();

  return (
    <FormField
      control={control}
      name="settings.memberPermissions"
      render={({ field }) => {
        const permissionSets: PermissionSet[] = field.value ?? [];

        const updateSet = (index: number, next: PermissionSet) => {
          field.onChange(permissionSets.map((set, i) => (i === index ? next : set)));
        };

        const togglePermission = (index: number, permission: Permission) => {
          const set = permissionSets[index];
          if (!set) return;
          const permissions = set.permissions.includes(permission)
            ? set.permissions.filter((value) => value !== permission)
            : [...set.permissions, permission];
          updateSet(index, { ...set, permissions });
        };

        return (
          <FormItem>
            <FormLabel>
              Member permissions<span aria-hidden="true"> *</span>
            </FormLabel>
            <FormControl>
              <div className="space-y-4">
                {permissionSets.map((permissionSet, index) => (
                  <div key={index} className="rounded-lg border space-y-3 p-4">
                    <div className="flex items-center justify-between">
                      <Select
                        value={permissionSet.role}
                        onValueChange={(value) =>
                          updateSet(index, { ...permissionSet, role: value as CommitteeRole })
                        }
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

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => field.onChange(permissionSets.filter((_, i) => i !== index))}
                        disabled={permissionSets.length <= 1}
                        aria-label={`Remove permission set ${index + 1}`}
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
                            onCheckedChange={() => togglePermission(index, permission.value)}
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
                  onClick={() =>
                    field.onChange([
                      ...permissionSets,
                      { role: "member", permissions: ["view", "download"] },
                    ])
                  }
                  className="w-full"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Permission Set
                </Button>
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}
