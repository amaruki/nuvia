import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TabsContent } from "@/components/ui/tabs";

import type { AnnouncementForm, AnnouncementFormFields } from "./types";

interface SettingsTabProps {
  form: AnnouncementForm;
  formValues: AnnouncementFormFields;
}

export function SettingsTab({ form, formValues }: SettingsTabProps) {
  return (
    <TabsContent value="settings" className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            value={formValues.status}
            onValueChange={(value) =>
              form.setValue("status", value as AnnouncementFormFields["status"])
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="review">Under Review</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="visibility">Visibility</Label>
          <Select
            value={formValues.visibility}
            onValueChange={(value) =>
              form.setValue("visibility", value as AnnouncementFormFields["visibility"])
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select visibility" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="public">Public</SelectItem>
              <SelectItem value="members_only">Members Only</SelectItem>
              <SelectItem value="premium_only">Premium Members</SelectItem>
              <SelectItem value="chapter_only">Chapter Members</SelectItem>
              <SelectItem value="committee_only">Committee Members</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="isPinned"
            checked={formValues.isPinned}
            onCheckedChange={(checked) => form.setValue("isPinned", checked as boolean)}
          />
          <Label htmlFor="isPinned">Pin to top</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="isUrgent"
            checked={formValues.isUrgent}
            onCheckedChange={(checked) => form.setValue("isUrgent", checked as boolean)}
          />
          <Label htmlFor="isUrgent">Mark as urgent</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="requiresAcknowledgment"
            checked={formValues.requiresAcknowledgment}
            onCheckedChange={(checked) =>
              form.setValue("requiresAcknowledgment", checked as boolean)
            }
          />
          <Label htmlFor="requiresAcknowledgment">Require acknowledgment</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="isFeatured"
            checked={formValues.isFeatured}
            onCheckedChange={(checked) => form.setValue("isFeatured", checked as boolean)}
          />
          <Label htmlFor="isFeatured">Feature announcement</Label>
        </div>
      </div>
    </TabsContent>
  );
}
