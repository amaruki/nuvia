import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { TabsContent } from "@/components/ui/tabs";
import { MapPin } from "lucide-react";
import { ChapterForm } from "./types";

interface ContactTabProps {
  form: ChapterForm;
}

export function ContactTab({ form }: ContactTabProps) {
  const copyAddressToContact = () => {
    const locationAddress = form.getValues("location.address");
    form.setValue("contactInfo.address", locationAddress);
  };

  return (
    <TabsContent value="contact" className="space-y-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Contact Information</h3>
          <Button type="button" variant="outline" size="sm" onClick={copyAddressToContact}>
            <MapPin className="mr-2 h-4 w-4" />
            Copy from Location
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="contactEmail">Email *</Label>
            <Input
              id="contactEmail"
              type="email"
              placeholder="chapter@example.org"
              {...form.register("contactInfo.email")}
            />
            {form.formState.errors.contactInfo?.email && (
              <p className="text-sm text-destructive">
                {form.formState.errors.contactInfo.email.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactPhone">Phone</Label>
            <Input
              id="contactPhone"
              placeholder="+1 (555) 123-4567"
              {...form.register("contactInfo.phone")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactWebsite">Website</Label>
            <Input
              id="contactWebsite"
              placeholder="https://chapter.example.org"
              {...form.register("contactInfo.website")}
            />
            {form.formState.errors.contactInfo?.website && (
              <p className="text-sm text-destructive">
                {form.formState.errors.contactInfo.website.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactAddress">Mailing Address</Label>
            <Input
              id="contactAddress"
              placeholder="PO Box 123, City, State 12345"
              {...form.register("contactInfo.mailingAddress")}
            />
          </div>
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Social Media</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="facebook">Facebook</Label>
            <Input
              id="facebook"
              placeholder="https://facebook.com/chapter"
              {...form.register("socialMedia.facebook")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="twitter">Twitter</Label>
            <Input
              id="twitter"
              placeholder="https://twitter.com/chapter"
              {...form.register("socialMedia.twitter")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="linkedin">LinkedIn</Label>
            <Input
              id="linkedin"
              placeholder="https://linkedin.com/company/chapter"
              {...form.register("socialMedia.linkedin")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="instagram">Instagram</Label>
            <Input
              id="instagram"
              placeholder="https://instagram.com/chapter"
              {...form.register("socialMedia.instagram")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="youtube">YouTube</Label>
            <Input
              id="youtube"
              placeholder="https://youtube.com/channel/chapter"
              {...form.register("socialMedia.youtube")}
            />
          </div>
        </div>
      </div>
    </TabsContent>
  );
}
