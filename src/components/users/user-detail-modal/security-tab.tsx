import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";
import { Key, Mail, Phone, Shield } from "lucide-react";
import { UserStatus } from "@/types/user-management.types";
import type { UserProfile } from "@/types/user-management.types";
import { cn } from "@/lib/utils";

interface SecurityTabProps {
  user: UserProfile;
}

export default function SecurityTab({ user }: SecurityTabProps) {
  return (
    <TabsContent value="security" className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="size-4" />
            Security Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <div className="font-medium">Email Verification</div>
                <div className="text-sm text-muted-foreground">
                  {user.emailVerified ? "Verified" : "Not verified"}
                </div>
              </div>
              <div
                className={cn(
                  "size-8 rounded-full flex items-center justify-center",
                  user.emailVerified ? "bg-success/15" : "bg-muted",
                )}
              >
                <Mail
                  className={cn(
                    "size-4",
                    user.emailVerified ? "text-success" : "text-muted-foreground",
                  )}
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <div className="font-medium">Phone Verification</div>
                <div className="text-sm text-muted-foreground">
                  {user.phoneVerified ? "Verified" : "Not verified"}
                </div>
              </div>
              <div
                className={cn(
                  "size-8 rounded-full flex items-center justify-center",
                  user.phoneVerified ? "bg-success/15" : "bg-muted",
                )}
              >
                <Phone
                  className={cn(
                    "size-4",
                    user.phoneVerified ? "text-success" : "text-muted-foreground",
                  )}
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <div className="font-medium">Two-Factor Authentication</div>
                <div className="text-sm text-muted-foreground">
                  {user.authStatus === "two_factor_enabled" ? "Enabled" : "Disabled"}
                </div>
              </div>
              <div
                className={cn(
                  "size-8 rounded-full flex items-center justify-center",
                  user.authStatus === "two_factor_enabled" ? "bg-info/15" : "bg-warning/15",
                )}
              >
                <Key
                  className={cn(
                    "size-4",
                    user.authStatus === "two_factor_enabled" ? "text-info" : "text-warning",
                  )}
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <div className="font-medium">Account Status</div>
                <div className="text-sm text-muted-foreground">
                  {user.status.replace("_", " ").charAt(0).toUpperCase() +
                    user.status.replace("_", " ").slice(1)}
                </div>
              </div>
              <div
                className={cn(
                  "size-8 rounded-full flex items-center justify-center",
                  user.status === UserStatus.ACTIVE ? "bg-success/15" : "bg-muted",
                )}
              >
                <Shield
                  className={cn(
                    "size-4",
                    user.status === UserStatus.ACTIVE ? "text-success" : "text-muted-foreground",
                  )}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
}
