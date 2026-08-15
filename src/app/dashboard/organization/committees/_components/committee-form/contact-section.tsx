import { TextField } from "@/components/dashboard/form-sheet";

export function ContactSection() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <TextField
          name="contactInfo.email"
          label="Email address"
          type="email"
          required
          placeholder="committee@org.org"
          autoComplete="off"
        />
        <TextField
          name="contactInfo.phone"
          label="Phone number"
          type="tel"
          placeholder="+1 (555) 123-4567"
          autoComplete="off"
        />
      </div>

      <TextField
        name="contactInfo.meetingLocation"
        label="Meeting location"
        placeholder="Conference Room A, Headquarters"
      />

      <div className="grid gap-4 md:grid-cols-2">
        <TextField
          name="contactInfo.virtualMeetingLink"
          label="Virtual meeting link"
          type="url"
          placeholder="https://zoom.us/j/committee"
        />
        <TextField
          name="contactInfo.website"
          label="Website"
          type="url"
          placeholder="https://org.org/committees/finance"
        />
      </div>
    </div>
  );
}
