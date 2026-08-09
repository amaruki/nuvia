import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TabsContent } from "@/components/ui/tabs";
import { Plus, Trash2 } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import type { TierFormData } from "./types";

interface FeaturesTabProps {
  formData: TierFormData;
  setFormData: Dispatch<SetStateAction<TierFormData>>;
  newFeature: string;
  setNewFeature: Dispatch<SetStateAction<string>>;
}

export default function FeaturesTab({
  formData,
  setFormData,
  newFeature,
  setNewFeature,
}: FeaturesTabProps) {
  const addFeature = () => {
    if (newFeature.trim()) {
      setFormData((prev) => ({
        ...prev,
        features: [...prev.features, newFeature.trim()],
      }));
      setNewFeature("");
    }
  };

  const removeFeature = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }));
  };

  const removeBenefit = (index: number) => {
    const benefitIndex = index - formData.features.length;
    setFormData((prev) => ({
      ...prev,
      benefits: prev.benefits.filter((_, i) => i !== benefitIndex),
    }));
  };

  return (
    <TabsContent value="features" className="space-y-4 mt-6">
      <div className="space-y-2">
        <Label>Features & Benefits</Label>
        <p className="text-sm text-muted-foreground">
          Add features and benefits for this membership tier
        </p>
      </div>

      <div className="flex space-x-2">
        <Input
          value={newFeature}
          onChange={(e) => setNewFeature(e.target.value)}
          placeholder="Add a feature or benefit..."
          onKeyPress={(e) => e.key === "Enter" && addFeature()}
        />
        <Button onClick={addFeature} size="sm">
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {[...formData.features, ...formData.benefits].map((item, index) => (
          <div key={index} className="flex items-center space-x-3 p-2 border rounded">
            <span className="flex-1 text-sm">{item}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (index < formData.features.length) {
                  removeFeature(index);
                } else {
                  removeBenefit(index);
                }
              }}
            >
              <Trash2 className="w-4 h-4 text-destructive" />
            </Button>
          </div>
        ))}
      </div>

      {formData.features.length === 0 && formData.benefits.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>No features or benefits added yet</p>
        </div>
      )}
    </TabsContent>
  );
}
