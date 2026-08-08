import { useFieldArray } from "react-hook-form";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion } from "@/components/ui/accordion";

import { ModuleItem } from "./module-item";
import type { CourseFormInstance } from "./types";

interface CurriculumSectionProps {
  form: CourseFormInstance;
}

export function CurriculumSection({ form }: CurriculumSectionProps) {
  const {
    fields: moduleFields,
    append: appendModule,
    remove: removeModule,
  } = useFieldArray({
    control: form.control,
    name: "modules",
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle>Curriculum Builder</CardTitle>
          <CardDescription>Organize your course into modules and lessons.</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
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
              className="mt-4 w-full border-dashed"
              onClick={() => appendModule({ title: "New Module", lessons: [] })}
            >
              <Plus className="h-4 w-4 mr-2" /> Add Module
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
