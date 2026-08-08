import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TabsContent } from "@/components/ui/tabs";
import { Users, Lock, Settings } from "lucide-react";
import type { MediaPermission } from "@/types/media";

interface PermissionsTabProps {
  permissions: MediaPermission[];
}

export default function PermissionsTab({ permissions }: PermissionsTabProps) {
  return (
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
          {permissions.length > 0 ? (
            <div className="space-y-4">
              {permissions.map((permission) => (
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
              <p className="text-sm text-gray-600">This media file uses default permissions</p>
            </div>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  );
}
