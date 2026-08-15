import { MapPin } from "lucide-react";

import { TextField } from "@/components/dashboard/form-sheet";
import { Button } from "@/components/ui/button";

import type { ChapterFormSectionProps } from "./types";

/**
 * contactInfo.address has no direct input: it is populated from the
 * location address via "Copy from location", as before the FormSheet
 * migration. See TODO.md ("Good first issues").
 */
export function ContactSection({ form }: ChapterFormSectionProps) {
  const copyAddressToContact = () => {
    const locationAddress = form.getValues("location.address");
    form.setValue("contactInfo.address", locationAddress, { shouldDirty: true });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Contact details</p>
          <Button type="button" variant="outline" size="sm" onClick={copyAddressToContact}>
            <MapPin className="mr-2 h-4 w-4" />
            Copy from Location
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <TextField
            name="contactInfo.email"
            label="Email"
            type="email"
            required
            placeholder="chapter@example.org"
            autoComplete="off"
          />
          <TextField
            name="contactInfo.phone"
            label="Phone"
            type="tel"
            placeholder="+1 (555) 123-4567"
            autoComplete="off"
          />
          <TextField
            name="contactInfo.website"
            label="Website"
            type="url"
            placeholder="https://chapter.example.org"
          />
          <TextField
            name="contactInfo.mailingAddress"
            label="Mailing address"
            placeholder="PO Box 123, City, State 12345"
          />
        </div>
      </div>

      <div className="space-y-4">
        <p className="text-sm font-medium">Social media</p>
        <div className="grid gap-4 md:grid-cols-2">
          <TextField
            name="socialMedia.facebook"
            label="Facebook"
            type="url"
            placeholder="https://facebook.com/chapter"
          />
          <TextField
            name="socialMedia.twitter"
            label="Twitter"
            type="url"
            placeholder="https://twitter.com/chapter"
          />
          <TextField
            name="socialMedia.linkedin"
            label="LinkedIn"
            type="url"
            placeholder="https://linkedin.com/company/chapter"
          />
          <TextField
            name="socialMedia.instagram"
            label="Instagram"
            type="url"
            placeholder="https://instagram.com/chapter"
          />
          <TextField
            name="socialMedia.youtube"
            label="YouTube"
            type="url"
            placeholder="https://youtube.com/channel/chapter"
          />
        </div>
      </div>
    </div>
  );
}
