import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import { NumberField, TextareaField } from "@/components/dashboard/form-sheet";
import { Button } from "@/components/ui/button";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { authorityOptions } from "./options";
import type { CommitteeFormSectionProps } from "./types";

/**
 * The responsibilities list is a string field array (a deliberate shorthand
 * escape hatch), and the authority select keeps its two-line option labels,
 * so both compose FormField directly.
 */
export function CharterSection({ form }: CommitteeFormSectionProps) {
  const [newResponsibility, setNewResponsibility] = useState("");

  return (
    <div className="space-y-4">
      <TextareaField
        name="charter.missionStatement"
        label="Mission statement"
        required
        placeholder="Clear statement of the committee's mission and purpose..."
        rows={3}
      />

      <FormField
        control={form.control}
        name="charter.responsibilities"
        render={({ field }) => {
          const responsibilities = field.value ?? [];
          const addResponsibility = () => {
            const value = newResponsibility.trim();
            if (!value) return;
            field.onChange([...responsibilities, value]);
            setNewResponsibility("");
          };

          return (
            <FormItem>
              <FormLabel>
                Responsibilities<span aria-hidden="true"> *</span>
              </FormLabel>
              <FormControl>
                <div className="space-y-2">
                  {responsibilities.map((responsibility, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        value={responsibility}
                        onChange={(event) => {
                          const next = [...responsibilities];
                          next[index] = event.target.value;
                          field.onChange(next);
                        }}
                        placeholder="Enter responsibility..."
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          field.onChange(responsibilities.filter((_, i) => i !== index))
                        }
                        aria-label={`Remove responsibility ${index + 1}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}

                  <div className="flex items-center gap-2">
                    <Input
                      value={newResponsibility}
                      onChange={(event) => setNewResponsibility(event.target.value)}
                      placeholder="Add new responsibility..."
                      aria-label="Add a responsibility"
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          addResponsibility();
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addResponsibility}
                      aria-label="Add responsibility"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          );
        }}
      />

      <FormField
        control={form.control}
        name="charter.authorityLevel"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Authority level</FormLabel>
            <Select value={field.value} onValueChange={field.onChange}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select authority level" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {authorityOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div>
                      <div className="font-medium">{option.label}</div>
                      <div className="text-muted-foreground text-sm">{option.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <TextareaField
        name="charter.decisionMakingProcess"
        label="Decision making process"
        required
        placeholder="Describe how decisions are made within the committee..."
        rows={3}
      />

      <TextareaField
        name="charter.reportingStructure"
        label="Reporting structure"
        required
        placeholder="Describe the committee's reporting structure..."
        rows={3}
      />

      <div className="space-y-2">
        <p className="text-sm font-medium">Term limits (optional)</p>
        <div className="grid gap-4 md:grid-cols-3">
          <NumberField
            name="charter.termLimits.chairTerm"
            label="Chair term (months)"
            placeholder="24"
            min={1}
            max={60}
          />
          <NumberField
            name="charter.termLimits.memberTerm"
            label="Member term (months)"
            placeholder="24"
            min={1}
            max={60}
          />
          <NumberField
            name="charter.termLimits.maxTerms"
            label="Maximum terms"
            placeholder="2"
            min={1}
            max={10}
          />
        </div>
      </div>
    </div>
  );
}
