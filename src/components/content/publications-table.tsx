"use client";

import { useState } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  MoreHorizontal,
  Eye,
  Edit,
  Copy,
  Archive,
  Trash2,
  Calendar,
  Share2,
  Download,
  TrendingUp,
  Clock,
  CheckCircle2,
  FileText,
  BookOpen,
  Mail,
  BarChart3,
  Briefcase,
  Microscope,
  GraduationCap,
  Star,
  Building,
  Megaphone,
  User,
  ChevronUp,
  ChevronDown
} from "lucide-react";
import { Publication, PUBLICATION_TYPE_DISPLAY, PUBLICATION_STATUS_DISPLAY } from "@/types/publication.types";
import { cn } from "@/lib/utils";

interface PublicationsTableProps {
  publications: Publication[];
  onViewDetails: (publication: Publication) => void;
  onEdit: (publication: Publication) => void;
  onDelete: (publication: Publication) => void;
  onDuplicate: (publication: Publication) => void;
  onPublish: (publication: Publication) => void;
  onArchive: (publication: Publication) => void;
  onSchedule: (publication: Publication, date: Date) => void;
  selectedPublications?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
}

export function PublicationsTable({
  publications,
  onViewDetails,
  onEdit,
  onDelete,
  onDuplicate,
  onPublish,
  onArchive,
  onSchedule,
  selectedPublications = [],
  onSelectionChange
}: PublicationsTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const getTypeIcon = (type: string) => {
    const iconMap = {
      article: FileText,
      blog: Edit,
      newsletter: Mail,
      report: BarChart3,
      case_study: Briefcase,
      whitepaper: BookOpen,
      research_paper: Microscope
    };
    return iconMap[type as keyof typeof iconMap] || FileText;
  };

  const getCategoryIcon = (category: string) => {
    const iconMap = {
      technology: Microscope,
      business: Briefcase,
      research: Microscope,
      education: GraduationCap,
      industry_trends: TrendingUp,
      best_practices: CheckCircle2,
      case_studies: Briefcase,
      announcements: Megaphone,
      member_spotlight: Star,
      chapter_news: Building
    };
    return iconMap[category as keyof typeof iconMap] || FileText;
  };

  const getStatusIcon = (status: string) => {
    const iconMap = {
      draft: Edit,
      review: Clock,
      published: CheckCircle2,
      archived: Archive,
      scheduled: Calendar
    };
    return iconMap[status as keyof typeof iconMap] || Clock;
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return "—";
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    }).format(date);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("en-US").format(num);
  };

  const getEngagementColor = (score: number) => {
    if (score >= 85) return "text-emerald-600";
    if (score >= 70) return "text-amber-600";
    return "text-rose-600";
  };

  const toggleRowExpansion = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const handleSelectAll = (checked: boolean) => {
    if (onSelectionChange) {
      onSelectionChange(checked ? publications.map(p => p.id) : []);
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    if (onSelectionChange) {
      const newSelection = checked 
        ? [...selectedPublications, id]
        : selectedPublications.filter(selectedId => selectedId !== id);
      onSelectionChange(newSelection);
    }
  };

  const isAllSelected = publications.length > 0 && selectedPublications.length === publications.length;
  const isIndeterminate = selectedPublications.length > 0 && selectedPublications.length < publications.length;

  return (
    <div className="space-y-4">
      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all publications"
                />
              </TableHead>
              <TableHead className="w-[300px]">Title</TableHead>
              <TableHead className="w-[100px]">Type</TableHead>
              <TableHead className="w-[100px]">Status</TableHead>
              <TableHead className="w-[150px]">Author</TableHead>
              <TableHead className="w-[100px]">Category</TableHead>
              <TableHead className="w-[100px]">Published</TableHead>
              <TableHead className="w-[80px] text-right">Views</TableHead>
              <TableHead className="w-[100px] text-right">Engagement</TableHead>
              <TableHead className="w-[60px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {publications.map((publication) => {
              const TypeIcon = getTypeIcon(publication.type);
              const CategoryIcon = getCategoryIcon(publication.category);
              const StatusIcon = getStatusIcon(publication.status);
              const isExpanded = expandedRows.has(publication.id);
              const isSelected = selectedPublications.includes(publication.id);

              return (
                <React.Fragment key={publication.id}>
                  <TableRow className={cn("hover:bg-muted/50", isSelected && "bg-muted/30")}>
                    <TableCell>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked: boolean) => handleSelectRow(publication.id, checked)}
                        aria-label={`Select ${publication.title}`}
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {publication.isFeatured && (
                          <Star className="h-3 w-3 text-yellow-500 fill-current" />
                        )}
                        {publication.isPinned && (
                          <div className="h-3 w-3 bg-primary rounded-full" />
                        )}
                        <button
                          onClick={() => toggleRowExpansion(publication.id)}
                          className="text-left hover:text-primary transition-colors flex items-center gap-1"
                        >
                          <span className="truncate max-w-[200px]" title={publication.title}>
                            {publication.title}
                          </span>
                          {isExpanded ? (
                            <ChevronUp className="h-3 w-3" />
                          ) : (
                            <ChevronDown className="h-3 w-3" />
                          )}
                        </button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <TypeIcon className="h-4 w-4 text-muted-foreground" />
                        <Badge variant="secondary" className="text-xs">
                          {PUBLICATION_TYPE_DISPLAY[publication.type].name}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <StatusIcon className="h-4 w-4 text-muted-foreground" />
                        <Badge 
                          variant={PUBLICATION_STATUS_DISPLAY[publication.status].badgeVariant}
                          className="text-xs"
                        >
                          {PUBLICATION_STATUS_DISPLAY[publication.status].name}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center">
                          <User className="h-3 w-3 text-muted-foreground" />
                        </div>
                        <span className="text-sm truncate max-w-[100px]" title={publication.author.name}>
                          {publication.author.name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <CategoryIcon className="h-4 w-4 text-muted-foreground" />
                        <Badge variant="outline" className="text-xs">
                          {publication.category.replace('_', ' ')}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDate(publication.publishedAt)}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {formatNumber(publication.metrics.views)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span className={cn("text-sm font-medium", getEngagementColor(publication.metrics.engagementScore))}>
                          {publication.metrics.engagementScore}
                        </span>
                        <TrendingUp className="h-3 w-3 text-muted-foreground" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onViewDetails(publication)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onEdit(publication)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onDuplicate(publication)}>
                            <Copy className="mr-2 h-4 w-4" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {publication.status === 'draft' && (
                            <DropdownMenuItem onClick={() => onPublish(publication)}>
                              <CheckCircle2 className="mr-2 h-4 w-4" />
                              Publish
                            </DropdownMenuItem>
                          )}
                          {publication.status === 'published' && (
                            <DropdownMenuItem onClick={() => onArchive(publication)}>
                              <Archive className="mr-2 h-4 w-4" />
                              Archive
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => window.open(`/publications/${publication.slug}`, '_blank')}
                          >
                            <Share2 className="mr-2 h-4 w-4" />
                            Share
                          </DropdownMenuItem>
                          {publication.downloadEnabled && (
                            <DropdownMenuItem>
                              <Download className="mr-2 h-4 w-4" />
                              Download
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => onDelete(publication)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                  
                  {/* Expanded Row - Quick Preview */}
                  {isExpanded && (
                    <TableRow>
                      <TableCell colSpan={10} className="p-4 bg-muted/20">
                        <div className="grid gap-4 md:grid-cols-2">
                          <div>
                            <h4 className="font-medium mb-2">Content Preview</h4>
                            <p className="text-sm text-muted-foreground line-clamp-3">
                              {publication.excerpt}
                            </p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              <span>{publication.readTime} min read</span>
                              <span>•</span>
                              <span>{publication.wordCount} words</span>
                              <span>•</span>
                              <span>{publication.difficulty}</span>
                            </div>
                          </div>
                          <div>
                            <h4 className="font-medium mb-2">Metrics</h4>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div className="flex items-center gap-2">
                                <Eye className="h-3 w-3 text-muted-foreground" />
                                <span>{formatNumber(publication.metrics.views)} views</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Share2 className="h-3 w-3 text-muted-foreground" />
                                <span>{formatNumber(publication.metrics.shares)} shares</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Download className="h-3 w-3 text-muted-foreground" />
                                <span>{formatNumber(publication.metrics.downloads)} downloads</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <TrendingUp className="h-3 w-3 text-muted-foreground" />
                                <span>{publication.metrics.engagementScore} engagement</span>
                              </div>
                            </div>
                            {publication.tags.length > 0 && (
                              <div className="mt-3">
                                <h5 className="text-xs font-medium mb-2">Tags</h5>
                                <div className="flex flex-wrap gap-1">
                                  {publication.tags.map(tag => (
                                    <Badge 
                                      key={tag.id} 
                                      variant="secondary" 
                                      className="text-xs"
                                      style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
                                    >
                                      {tag.name}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {publications.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-40" />
          <h3 className="text-lg font-medium mb-2">No publications found</h3>
          <p className="text-sm">
            Try adjusting your filters or create a new publication to get started.
          </p>
        </div>
      )}
    </div>
  );
}

// Add React import for Fragment
import React from "react";