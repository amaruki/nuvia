import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { format } from "date-fns";
import {
  ClipboardList,
  Edit,
  Layers,
  Lightbulb,
  Megaphone,
  MessageSquare,
  MoreVertical,
  Trash2,
} from "lucide-react";

import type { ForumCategory } from "@/types/forum.types";

const iconMap: Record<string, ReactNode> = {
  MessageSquare: <MessageSquare className="h-5 w-5" />,
  Megaphone: <Megaphone className="h-5 w-5" />,
  Lightbulb: <Lightbulb className="h-5 w-5" />,
  ClipboardList: <ClipboardList className="h-5 w-5" />,
};

interface CategoryCardProps {
  category: ForumCategory;
  onEdit: (category: ForumCategory) => void;
  onDelete: (id: string) => void;
}

export function CategoryCard({ category, onEdit, onDelete }: CategoryCardProps) {
  return (
    <Card
      className="group relative overflow-hidden transition-all hover:shadow-md border-l-4"
      style={{ borderLeftColor: category.color }}
    >
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-primary/10 ring-1 ring-primary/20">
            {iconMap[category.icon] || <MessageSquare className="h-5 w-5 text-primary" />}
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base font-semibold leading-tight">{category.name}</CardTitle>
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
            <DropdownMenuItem onClick={() => onEdit(category)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => onDelete(category.id)}
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
  );
}
