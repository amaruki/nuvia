import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import type { CategoryFormData } from "./types";

interface CreateCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: CategoryFormData;
  onFormDataChange: (data: CategoryFormData) => void;
  onCreate: () => void;
  trigger: ReactNode;
}

export function CreateCategoryDialog({
  open,
  onOpenChange,
  formData,
  onFormDataChange,
  onCreate,
  trigger,
}: CreateCategoryDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Category</DialogTitle>
          <DialogDescription>Add a new discussion category to the forum.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => onFormDataChange({ ...formData, name: e.target.value })}
              placeholder="e.g. General Discussion"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="desc">Description</Label>
            <Input
              id="desc"
              value={formData.description}
              onChange={(e) => onFormDataChange({ ...formData, description: e.target.value })}
              placeholder="What is this category for?"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onCreate}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
