import { TextareaField } from "@/components/dashboard/form-sheet";

export function DescriptionSection() {
  return (
    <>
      <TextareaField
        name="description"
        label="Job Description"
        placeholder="Describe the role..."
        required
        className="min-h-[160px]"
      />
      <TextareaField
        name="requirements"
        label="Requirements"
        placeholder="What candidates should bring..."
        className="min-h-[120px]"
      />
      <TextareaField
        name="responsibilities"
        label="Responsibilities"
        placeholder="What the role will own..."
        className="min-h-[120px]"
      />
      <TextareaField
        name="benefits"
        label="Benefits"
        placeholder="Perks and benefits..."
        className="min-h-[120px]"
      />
    </>
  );
}
