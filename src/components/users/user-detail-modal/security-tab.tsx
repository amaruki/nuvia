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
                  user.emailVerified
                    ? "bg-green-100 dark:bg-green-900"
                    : "bg-gray-100 dark:bg-gray-900",
                )}
              >
                <Mail
                  className={cn("size-4", user.emailVerified ? "text-green-600" : "text-gray-500")}
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
                  user.phoneVerified
                    ? "bg-green-100 dark:bg-green-900"
                    : "bg-gray-100 dark:bg-gray-900",
                )}
              >
                <Phone
                  className={cn("size-4", user.phoneVerified ? "text-green-600" : "text-gray-500")}
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
                  user.authStatus === "two_factor_enabled"
                    ? "bg-purple-100 dark:bg-purple-900"
                    : "bg-orange-100 dark:bg-orange-900",
                )}
              >
                <Key
                  className={cn(
                    "size-4",
                    user.authStatus === "two_factor_enabled"
                      ? "text-purple-600"
                      : "text-orange-600",
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
                  user.status === UserStatus.ACTIVE
                    ? "bg-green-100 dark:bg-green-900"
                    : "bg-gray-100 dark:bg-gray-900",
                )}
              >
                <Shield
                  className={cn(
                    "size-4",
                    user.status === UserStatus.ACTIVE ? "text-green-600" : "text-gray-500",
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
