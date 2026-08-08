import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CommitteeForm } from "./types";

interface ContactSectionProps {
  form: CommitteeForm;
}

export function ContactSection({ form }: ContactSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Contact Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="committee@org.org"
              {...form.register("contactInfo.email")}
            />
            {form.formState.errors.contactInfo?.email && (
              <p className="text-sm text-destructive">
                {form.formState.errors.contactInfo.email.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              placeholder="+1 (555) 123-4567"
              {...form.register("contactInfo.phone")}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="meetingLocation">Meeting Location</Label>
          <Input
            id="meetingLocation"
            placeholder="Conference Room A, Headquarters"
            {...form.register("contactInfo.meetingLocation")}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="virtualMeetingLink">Virtual Meeting Link</Label>
            <Input
              id="virtualMeetingLink"
              placeholder="https://zoom.us/j/committee"
              {...form.register("contactInfo.virtualMeetingLink")}
            />
            {form.formState.errors.contactInfo?.virtualMeetingLink && (
              <p className="text-sm text-destructive">
                {form.formState.errors.contactInfo.virtualMeetingLink.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              placeholder="https://org.org/committees/finance"
              {...form.register("contactInfo.website")}
            />
            {form.formState.errors.contactInfo?.website && (
              <p className="text-sm text-destructive">
                {form.formState.errors.contactInfo.website.message}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
