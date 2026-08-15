import { Plus } from "lucide-react";
import { useFieldArray } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Accordion } from "@/components/ui/accordion";

import { ModuleItem } from "./module-item";
import type { CourseFormSectionProps } from "./types";

/**
 * Curriculum field array. Field arrays are a deliberate shorthand escape
 * hatch (CODING_STANDARD "Dashboard forms"): the module/lesson builder
 * composes the ui/form primitives through ModuleItem instead.
 */
export function CurriculumSection({ form }: CourseFormSectionProps) {
  const {
    fields: moduleFields,
    append: appendModule,
    remove: removeModule,
  } = useFieldArray({
    control: form.control,
    name: "modules",
  });

  return (
    <div className="space-y-4">
      {moduleFields.length === 0 && (
        <div className="text-center py-8 border-2 border-dashed rounded-lg bg-muted/5">
          <p className="text-muted-foreground mb-4">No modules added yet.</p>
          <Button
            type="button"
            variant="outline"
            onClick={() => appendModule({ title: "New Module", lessons: [] })}
          >
            <Plus className="h-4 w-4 mr-2" /> Start Adding Modules
          </Button>
        </div>
      )}

      <Accordion type="multiple" className="space-y-4">
        {moduleFields.map((field, index) => (
          <ModuleItem key={field.id} index={index} form={form} removeModule={removeModule} />
        ))}
      </Accordion>

      {moduleFields.length > 0 && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full border-dashed"
          onClick={() => appendModule({ title: "New Module", lessons: [] })}
        >
          <Plus className="h-4 w-4 mr-2" /> Add Module
        </Button>
      )}
    </div>
  );
}
