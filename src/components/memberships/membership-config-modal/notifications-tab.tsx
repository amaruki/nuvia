import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TabsContent } from "@/components/ui/tabs";
import { Mail } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import type { MembershipConfig } from "./types";

interface NotificationsTabProps {
  formData: MembershipConfig;
  setFormData: Dispatch<SetStateAction<MembershipConfig>>;
}

export default function NotificationsTab({ formData, setFormData }: NotificationsTabProps) {
  return (
    <TabsContent value="notifications" className="space-y-4 mt-6">
      <div className="space-y-4">
        <div className="flex items-center space-x-3">
          <Mail className="w-5 h-5 text-muted-foreground" />
          <div>
            <h3 className="font-medium">Email Notifications</h3>
            <p className="text-sm text-muted-foreground">
              Configure automated email communications
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <Checkbox
              id="welcomeEmail"
              checked={formData.welcomeEmail}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({ ...prev, welcomeEmail: checked as boolean }))
              }
            />
            <Label htmlFor="welcomeEmail">Send welcome email to new members</Label>
          </div>

          <div className="flex items-center space-x-3">
            <Checkbox
              id="upgradeReminders"
              checked={formData.upgradeReminders}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({ ...prev, upgradeReminders: checked as boolean }))
              }
            />
            <Label htmlFor="upgradeReminders">Send upgrade reminders</Label>
          </div>

          <div className="flex items-center space-x-3">
            <Checkbox
              id="renewalReminders"
              checked={formData.renewalReminders}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({ ...prev, renewalReminders: checked as boolean }))
              }
            />
            <Label htmlFor="renewalReminders">Send renewal reminders</Label>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="adminEmail">Admin Notification Email</Label>
          <Input id="adminEmail" type="email" placeholder="admin@example.com" />
        </div>
      </div>
    </TabsContent>
  );
}
