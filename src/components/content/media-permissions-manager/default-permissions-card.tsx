import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe, Lock, Users } from "lucide-react";

export function DefaultPermissionsCard() {
  return (
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
              <p className="text-sm text-gray-600">Anyone can view and download this media file</p>
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
  );
}
