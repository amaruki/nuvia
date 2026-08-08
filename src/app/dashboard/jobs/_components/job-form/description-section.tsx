import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { JobFormState, SetJobFormField } from "./types";

interface DescriptionSectionProps {
  formData: JobFormState;
  setField: SetJobFormField;
}

export function DescriptionSection({ formData, setField }: DescriptionSectionProps) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="description">Job Description</Label>
        <Textarea
          id="description"
          placeholder="Describe the role..."
          className="min-h-[160px]"
          value={formData.description}
          onChange={(e) => setField("description", e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="requirements">Requirements</Label>
        <Textarea
          id="requirements"
          placeholder="What candidates should bring..."
          className="min-h-[120px]"
          value={formData.requirements}
          onChange={(e) => setField("requirements", e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="responsibilities">Responsibilities</Label>
        <Textarea
          id="responsibilities"
          placeholder="What the role will own..."
          className="min-h-[120px]"
          value={formData.responsibilities}
          onChange={(e) => setField("responsibilities", e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="benefits">Benefits</Label>
        <Textarea
          id="benefits"
          placeholder="Perks and benefits..."
          className="min-h-[120px]"
          value={formData.benefits}
          onChange={(e) => setField("benefits", e.target.value)}
        />
      </div>
    </>
  );
}
