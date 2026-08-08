import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { JobFormState, SetJobFormField } from "./types";

interface SettingsSectionProps {
  formData: JobFormState;
  setField: SetJobFormField;
}

export function SettingsSection({ formData, setField }: SettingsSectionProps) {
  return (
    <>
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Checkbox
            id="isRemote"
            checked={formData.isRemote}
            onCheckedChange={(checked) => setField("isRemote", checked === true)}
          />
          <Label htmlFor="isRemote" className="font-normal">
            Remote friendly
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="isFeatured"
            checked={formData.isFeatured}
            onCheckedChange={(checked) => setField("isFeatured", checked === true)}
          />
          <Label htmlFor="isFeatured" className="font-normal">
            Feature on the public job board
          </Label>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="tags">Tags (comma separated)</Label>
        <Input
          id="tags"
          placeholder="e.g. react, typescript, remote"
          value={formData.tags}
          onChange={(e) => setField("tags", e.target.value)}
        />
      </div>
    </>
  );
}
