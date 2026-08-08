import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CommitteeAuthorityLevel } from "@/types/committee.types";
import { Plus, Trash2 } from "lucide-react";
import { authorityOptions } from "./options";
import { CommitteeForm } from "./types";

interface CharterSectionProps {
  form: CommitteeForm;
}

export function CharterSection({ form }: CharterSectionProps) {
  const [newResponsibility, setNewResponsibility] = useState("");

  const handleAddResponsibility = () => {
    if (newResponsibility.trim()) {
      const currentResponsibilities = form.getValues("charter.responsibilities") || [];
      form.setValue("charter.responsibilities", [
        ...currentResponsibilities,
        newResponsibility.trim(),
      ]);
      setNewResponsibility("");
    }
  };

  const handleRemoveResponsibility = (index: number) => {
    const currentResponsibilities = form.getValues("charter.responsibilities") || [];
    form.setValue(
      "charter.responsibilities",
      currentResponsibilities.filter((_, i) => i !== index),
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Committee Charter</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="missionStatement">Mission Statement</Label>
          <Textarea
            id="missionStatement"
            placeholder="Clear statement of the committee's mission and purpose..."
            rows={3}
            {...form.register("charter.missionStatement")}
          />
          {form.formState.errors.charter?.missionStatement && (
            <p className="text-sm text-destructive">
              {form.formState.errors.charter.missionStatement.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Responsibilities</Label>
          <div className="space-y-2">
            {form.watch("charter.responsibilities")?.map((responsibility, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  value={responsibility}
                  onChange={(e) => {
                    const current = form.getValues("charter.responsibilities") || [];
                    current[index] = e.target.value;
                    form.setValue("charter.responsibilities", current);
                  }}
                  placeholder="Enter responsibility..."
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleRemoveResponsibility(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}

            <div className="flex items-center gap-2">
              <Input
                value={newResponsibility}
                onChange={(e) => setNewResponsibility(e.target.value)}
                placeholder="Add new responsibility..."
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddResponsibility();
                  }
                }}
              />
              <Button type="button" variant="outline" size="sm" onClick={handleAddResponsibility}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
          {form.formState.errors.charter?.responsibilities && (
            <p className="text-sm text-destructive">
              {form.formState.errors.charter.responsibilities.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="authorityLevel">Authority Level</Label>
          <Select
            value={form.watch("charter.authorityLevel")}
            onValueChange={(value) =>
              form.setValue("charter.authorityLevel", value as CommitteeAuthorityLevel)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select authority level" />
            </SelectTrigger>
            <SelectContent>
              {authorityOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div>
                    <div className="font-medium">{option.label}</div>
                    <div className="text-sm text-muted-foreground">{option.description}</div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="decisionMakingProcess">Decision Making Process</Label>
          <Textarea
            id="decisionMakingProcess"
            placeholder="Describe how decisions are made within the committee..."
            rows={3}
            {...form.register("charter.decisionMakingProcess")}
          />
          {form.formState.errors.charter?.decisionMakingProcess && (
            <p className="text-sm text-destructive">
              {form.formState.errors.charter.decisionMakingProcess.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="reportingStructure">Reporting Structure</Label>
          <Textarea
            id="reportingStructure"
            placeholder="Describe the committee's reporting structure..."
            rows={3}
            {...form.register("charter.reportingStructure")}
          />
          {form.formState.errors.charter?.reportingStructure && (
            <p className="text-sm text-destructive">
              {form.formState.errors.charter.reportingStructure.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Term Limits (Optional)</Label>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="chairTerm">Chair Term (months)</Label>
              <Input
                id="chairTerm"
                type="number"
                placeholder="24"
                {...form.register("charter.termLimits.chairTerm", { valueAsNumber: true })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="memberTerm">Member Term (months)</Label>
              <Input
                id="memberTerm"
                type="number"
                placeholder="24"
                {...form.register("charter.termLimits.memberTerm", { valueAsNumber: true })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxTerms">Maximum Terms</Label>
              <Input
                id="maxTerms"
                type="number"
                placeholder="2"
                {...form.register("charter.termLimits.maxTerms", { valueAsNumber: true })}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
