import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Edit, Plus, Shield, Trash2, User } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PermissionsListCardProps } from "./types";
import { getEntityTypeIcon, getPermissionColor, getPermissionIcon } from "./helpers";

export function PermissionsListCard({
  permissions,
  searchTerm,
  filterType,
  onEdit,
  onDelete,
  onAddFirst,
}: PermissionsListCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Current Permissions ({permissions.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {permissions.length > 0 ? (
          <div className="space-y-4">
            {permissions.map((permission) => (
              <div key={permission.id} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      {getEntityTypeIcon(permission.entityType)}
                      <div>
                        <p className="font-medium">{permission.entityName}</p>
                        <p className="text-sm text-gray-600 capitalize">{permission.entityType}</p>
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
                    <Button variant="ghost" size="sm" onClick={() => onEdit(permission)}>
                      <Edit className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(permission.id)}
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
              <Button onClick={onAddFirst}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Permission
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
