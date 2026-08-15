"use client";

import { CheckboxField } from "@/components/dashboard/form-sheet";

/** Notification delivery and where the announcement surfaces. */
export function DisplaySection() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h4 className="text-sm font-medium">Notification settings</h4>
        <CheckboxField name="sendEmailNotification" label="Send email notification" />
        <CheckboxField name="sendPushNotification" label="Send push notification" />
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-medium">Display options</h4>
        <CheckboxField name="displayOnHomepage" label="Display on homepage" />
        <CheckboxField name="displayInDashboard" label="Display in dashboard" />
        <CheckboxField name="commentsEnabled" label="Enable comments" />
        <CheckboxField name="sharingEnabled" label="Enable sharing" />
        <CheckboxField name="downloadEnabled" label="Enable download" />
      </div>
    </div>
  );
}
