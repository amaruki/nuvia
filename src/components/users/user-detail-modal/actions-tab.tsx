import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";
import { Ban, Edit, Eye, Key, Mail, Settings, UserCheck } from "lucide-react";
import { UserStatus } from "@/types/user-management.types";
import type { UserProfile } from "@/types/user-management.types";

interface ActionsTabProps {
  user: UserProfile;
  isAdmin: boolean;
  isModerator: boolean;
}

export default function ActionsTab({ user, isAdmin, isModerator }: ActionsTabProps) {
  return (
    <TabsContent value="actions" className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Settings className="size-4" />
            User Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            <Button variant="outline" className="gap-2 justify-start">
              <Eye className="size-4" />
              View Full Profile
            </Button>

            {isModerator && (
              <Button variant="outline" className="gap-2 justify-start">
                <Edit className="size-4" />
                Edit User
              </Button>
            )}

            {isModerator && user.status !== UserStatus.ACTIVE && (
              <Button variant="default" className="gap-2 justify-start">
                <UserCheck className="size-4" />
                Activate User
              </Button>
            )}

            {isModerator && user.status === UserStatus.ACTIVE && (
              <Button variant="outline" className="gap-2 justify-start">
                <Ban className="size-4" />
                Suspend User
              </Button>
            )}

            {isAdmin && (
              <Button variant="outline" className="gap-2 justify-start">
                <Key className="size-4" />
                Reset Password
              </Button>
            )}

            <Button variant="outline" className="gap-2 justify-start">
              <Mail className="size-4" />
              Send Email
            </Button>
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
}
