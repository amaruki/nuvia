import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { TabsContent } from "@/components/ui/tabs";

import type { AnnouncementForm, AnnouncementFormFields } from "./types";

interface DisplayTabProps {
  form: AnnouncementForm;
  formValues: AnnouncementFormFields;
}

export function DisplayTab({ form, formValues }: DisplayTabProps) {
  return (
    <TabsContent value="display" className="space-y-4">
      <div className="space-y-4">
        <h4 className="text-sm font-medium">Notification Settings</h4>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="sendEmailNotification"
            checked={formValues.sendEmailNotification}
            onCheckedChange={(checked) =>
              form.setValue("sendEmailNotification", checked as boolean)
            }
          />
          <Label htmlFor="sendEmailNotification">Send email notification</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="sendPushNotification"
            checked={formValues.sendPushNotification}
            onCheckedChange={(checked) => form.setValue("sendPushNotification", checked as boolean)}
          />
          <Label htmlFor="sendPushNotification">Send push notification</Label>
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <h4 className="text-sm font-medium">Display Options</h4>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="displayOnHomepage"
            checked={formValues.displayOnHomepage}
            onCheckedChange={(checked) => form.setValue("displayOnHomepage", checked as boolean)}
          />
          <Label htmlFor="displayOnHomepage">Display on homepage</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="displayInDashboard"
            checked={formValues.displayInDashboard}
            onCheckedChange={(checked) => form.setValue("displayInDashboard", checked as boolean)}
          />
          <Label htmlFor="displayInDashboard">Display in dashboard</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="commentsEnabled"
            checked={formValues.commentsEnabled}
            onCheckedChange={(checked) => form.setValue("commentsEnabled", checked as boolean)}
          />
          <Label htmlFor="commentsEnabled">Enable comments</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="sharingEnabled"
            checked={formValues.sharingEnabled}
            onCheckedChange={(checked) => form.setValue("sharingEnabled", checked as boolean)}
          />
          <Label htmlFor="sharingEnabled">Enable sharing</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="downloadEnabled"
            checked={formValues.downloadEnabled}
            onCheckedChange={(checked) => form.setValue("downloadEnabled", checked as boolean)}
          />
          <Label htmlFor="downloadEnabled">Enable download</Label>
        </div>
      </div>
    </TabsContent>
  );
}
