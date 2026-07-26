"use client";

import React, { useState, useEffect } from "react";
import { ForumLayout } from "./forum-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  MoreVertical,
  MessageSquare,
  Megaphone,
  Lightbulb,
  ClipboardList,
  Trash2,
  Edit,
  GripVertical,
  Layers,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { getMockCategories, ForumCategory } from "@/lib/data/mock-forums";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/logger";

const iconMap: Record<string, React.ReactNode> = {
  MessageSquare: <MessageSquare className="h-5 w-5" />,
  Megaphone: <Megaphone className="h-5 w-5" />,
  Lightbulb: <Lightbulb className="h-5 w-5" />,
  ClipboardList: <ClipboardList className="h-5 w-5" />,
};

export function CategoryManager() {
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<ForumCategory | null>(null);

  // Form states - simplified for mock
  const [formData, setFormData] = useState({ name: "", description: "" });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setIsLoading(true);
    try {
      const data = await getMockCategories();
      setCategories(data);
    } catch (error) {
      logger.error("Failed to load categories", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this category?")) {
      setCategories((prev) => prev.filter((c) => c.id !== id));
    }
  };

  const handleEdit = (category: ForumCategory) => {
    setCurrentCategory(category);
    setFormData({ name: category.name, description: category.description });
    setIsEditOpen(true);
  };

  const handleUpdate = () => {
    if (currentCategory) {
      setCategories((prev) =>
        prev.map((c) => (c.id === currentCategory.id ? { ...c, ...formData } : c)),
      );
      setIsEditOpen(false);
      setCurrentCategory(null);
    }
  };

  const handleCreate = () => {
    const newCat: ForumCategory = {
      id: `new-${Date.now()}`,
      name: formData.name,
      description: formData.description,
      icon: "MessageSquare",
      color: "#6b7280",
      postCount: 0,
      createdAt: new Date().toISOString(),
    };
    setCategories([...categories, newCat]);
    setIsCreateOpen(false);
    setFormData({ name: "", description: "" });
  };

  return (
    <ForumLayout
      title="Forum Categories"
      description="Manage the structure of your community discussions."
      total={categories.length}
      actions={
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Category
            </Button>
          </DialogTrigger>
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
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. General Discussion"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="desc">Description</Label>
                <Input
                  id="desc"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="What is this category for?"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      }
    >
      {isLoading ? (
        // Skeleton loading
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="animate-pulse border-l-4 border-l-muted">
              <CardContent className="p-5">
                <div className="flex items-start gap-4 mb-5">
                  <div className="size-16 rounded-full bg-muted/50" />
                  <div className="flex-1 space-y-2">
                    <div className="h-5 w-32 bg-muted/50 rounded" />
                    <div className="h-4 w-24 bg-muted/30 rounded" />
                    <div className="h-4 w-28 bg-muted/30 rounded" />
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="h-4 w-full bg-muted/30 rounded" />
                  <div className="h-4 w-full bg-muted/30 rounded" />
                  <div className="h-4 w-3/4 bg-muted/30 rounded" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : categories.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {categories.map((category) => (
            <Card
              key={category.id}
              className="group relative overflow-hidden transition-all hover:shadow-md border-l-4"
              style={{ borderLeftColor: category.color }}
            >
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-primary/10 ring-1 ring-primary/20">
                    {iconMap[category.icon] || <MessageSquare className="h-5 w-5 text-primary" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base font-semibold leading-tight">
                      {category.name}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">
                      {category.postCount} {category.postCount === 1 ? "post" : "posts"}
                    </p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                      <span className="sr-only">Open menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => handleEdit(category)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => handleDelete(category.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem] leading-relaxed">
                  {category.description}
                </p>
                {category.lastPostAt && (
                  <div className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Layers className="h-3.5 w-3.5" />
                    <span>Last active {format(new Date(category.lastPostAt), "MMM d, yyyy")}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="p-12">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="flex items-center justify-center size-16 rounded-full bg-muted/50 mb-4">
                <Layers className="size-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No categories found</h3>
              <p className="text-sm text-muted-foreground max-w-sm mb-4">
                Create your first discussion category to start organizing your community forums.
              </p>
              <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Create Category
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Category</DialogTitle>
                    <DialogDescription>
                      Add a new discussion category to the forum.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. General Discussion"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="desc">Description</Label>
                      <Input
                        id="desc"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="What is this category for?"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreate}>Create</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-desc">Description</Label>
              <Input
                id="edit-desc"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ForumLayout>
  );
}
