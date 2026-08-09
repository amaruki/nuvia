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
import type { Dispatch, SetStateAction } from "react";
import type { TierFormData } from "./types";

interface AdvancedTabProps {
  formData: TierFormData;
  setFormData: Dispatch<SetStateAction<TierFormData>>;
}

export default function AdvancedTab({ formData, setFormData }: AdvancedTabProps) {
  return (
    <TabsContent value="advanced" className="space-y-4 mt-6">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Visibility</Label>
            <div className="flex items-center space-x-2 pt-2">
              <Checkbox
                id="visibility"
                checked={formData.visibility}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, visibility: checked as boolean }))
                }
              />
              <Label htmlFor="visibility">Visible to users</Label>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Upgrade Path</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select upgrade path..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="basic">From Basic</SelectItem>
                <SelectItem value="professional">To Professional</SelectItem>
                <SelectItem value="corporate">To Corporate</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </TabsContent>
  );
}
