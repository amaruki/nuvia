import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { TabsContent } from "@/components/ui/tabs";
import { meetingFrequencyOptions } from "./options";
import { ChapterForm } from "./types";

interface SettingsTabProps {
  form: ChapterForm;
}

export function SettingsTab({ form }: SettingsTabProps) {
  return (
    <TabsContent value="settings" className="space-y-4">
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Membership Settings</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="membershipDues">Annual Membership Dues ($) *</Label>
            <Input
              id="membershipDues"
              type="number"
              min="0"
              step="0.01"
              placeholder="100"
              {...form.register("settings.membershipDues", { valueAsNumber: true })}
            />
            {form.formState.errors.settings?.membershipDues && (
              <p className="text-sm text-destructive">
                {form.formState.errors.settings.membershipDues.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="meetingFrequency">Meeting Frequency *</Label>
            <Select
              value={form.watch("settings.meetingFrequency")}
              onValueChange={(value) => form.setValue("settings.meetingFrequency", value as any)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                {meetingFrequencyOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="meetingDay">Meeting Day</Label>
            <Input
              id="meetingDay"
              placeholder="Third Thursday"
              {...form.register("settings.meetingDay")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="meetingTime">Meeting Time</Label>
            <Input
              id="meetingTime"
              placeholder="6:00 PM"
              {...form.register("settings.meetingTime")}
            />
          </div>
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Chapter Settings</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="allowOnlineRegistration">Allow Online Registration</Label>
              <p className="text-sm text-muted-foreground">Enable new members to register online</p>
            </div>
            <Switch
              id="allowOnlineRegistration"
              checked={form.watch("settings.allowOnlineRegistration")}
              onCheckedChange={(checked) =>
                form.setValue("settings.allowOnlineRegistration", checked)
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="requireApproval">Require Approval</Label>
              <p className="text-sm text-muted-foreground">
                Require admin approval for new members
              </p>
            </div>
            <Switch
              id="requireApproval"
              checked={form.watch("settings.requireApproval")}
              onCheckedChange={(checked) => form.setValue("settings.requireApproval", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="autoRenewMembership">Auto-Renew Membership</Label>
              <p className="text-sm text-muted-foreground">Automatically renew memberships</p>
            </div>
            <Switch
              id="autoRenewMembership"
              checked={form.watch("settings.autoRenewMembership")}
              onCheckedChange={(checked) => form.setValue("settings.autoRenewMembership", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="sendReminders">Send Reminders</Label>
              <p className="text-sm text-muted-foreground">Send meeting and event reminders</p>
            </div>
            <Switch
              id="sendReminders"
              checked={form.watch("settings.sendReminders")}
              onCheckedChange={(checked) => form.setValue("settings.sendReminders", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="publicDirectory">Public Directory</Label>
              <p className="text-sm text-muted-foreground">List chapter in public directory</p>
            </div>
            <Switch
              id="publicDirectory"
              checked={form.watch("settings.publicDirectory")}
              onCheckedChange={(checked) => form.setValue("settings.publicDirectory", checked)}
            />
          </div>
        </div>
      </div>
    </TabsContent>
  );
}
