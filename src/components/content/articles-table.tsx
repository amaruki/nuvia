"use client";

import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
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
  ChevronDown,
  Timer,
  Zap,
} from "lucide-react";
import {
  Article,
  ARTICLE_TYPE_DISPLAY,
  ARTICLE_STATUS_DISPLAY,
  ARTICLE_CATEGORY_DISPLAY,
  ARTICLE_DIFFICULTY_DISPLAY,
} from "@/types/article";
import { cn } from "@/lib/utils";

interface ArticlesTableProps {
  articles: Article[];
  onViewDetails: (article: Article) => void;
  onEdit: (article: Article) => void;
  onDelete: (article: Article) => void;
  onDuplicate: (article: Article) => void;
  onPublish: (article: Article) => void;
  onArchive: (article: Article) => void;
  onSchedule: (article: Article, date: Date) => void;
  selectedArticles?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
}

export function ArticlesTable({
  articles,
  onViewDetails,
  onEdit,
  onDelete,
  onDuplicate,
  onPublish,
  onArchive,
  onSchedule,
  selectedArticles = [],
  onSelectionChange,
}: ArticlesTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const getTypeIcon = (type: string) => {
    const iconMap = {
      tutorial: BookOpen,
      guide: FileText,
      opinion: Mail,
      case_study: Briefcase,
      research_summary: Microscope,
      news: Megaphone,
      interview: User,
    };
    return iconMap[type as keyof typeof iconMap] || FileText;
  };

  const getCategoryIcon = (category: string) => {
    const iconMap = {
      technology: Microscope,
      business: Briefcase,
      education: GraduationCap,
      research: Microscope,
      industry_trends: TrendingUp,
      best_practices: CheckCircle2,
      member_stories: Star,
      chapter_news: Building,
      announcements: Megaphone,
      career_development: TrendingUp,
    };
    return iconMap[category as keyof typeof iconMap] || FileText;
  };

  const getDifficultyIcon = (difficulty: string) => {
    const iconMap = {
      beginner: Star,
      intermediate: Timer,
      advanced: Zap,
    };
    return iconMap[difficulty as keyof typeof iconMap] || Star;
  };

  const getStatusIcon = (status: string) => {
    const iconMap = {
      draft: Edit,
      review: Clock,
      published: CheckCircle2,
      archived: Archive,
      scheduled: Calendar,
    };
    return iconMap[status as keyof typeof iconMap] || Clock;
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return "—";
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
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
      onSelectionChange(checked ? articles.map((a) => a.id) : []);
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    if (onSelectionChange) {
      const newSelection = checked
        ? [...selectedArticles, id]
        : selectedArticles.filter((selectedId) => selectedId !== id);
      onSelectionChange(newSelection);
    }
  };

  const isAllSelected = articles.length > 0 && selectedArticles.length === articles.length;
  const isIndeterminate = selectedArticles.length > 0 && selectedArticles.length < articles.length;

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
                  aria-label="Select all articles"
                />
              </TableHead>
              <TableHead className="w-[300px]">Title</TableHead>
              <TableHead className="w-[100px]">Type</TableHead>
              <TableHead className="w-[100px]">Status</TableHead>
              <TableHead className="w-[150px]">Author</TableHead>
              <TableHead className="w-[100px]">Category</TableHead>
              <TableHead className="w-[100px]">Difficulty</TableHead>
              <TableHead className="w-[100px]">Published</TableHead>
              <TableHead className="w-[80px] text-right">Views</TableHead>
              <TableHead className="w-[100px] text-right">Engagement</TableHead>
              <TableHead className="w-[60px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {articles.map((article) => {
              const TypeIcon = getTypeIcon(article.type);
              const CategoryIcon = getCategoryIcon(article.category);
              const DifficultyIcon = getDifficultyIcon(article.difficulty);
              const StatusIcon = getStatusIcon(article.status);
              const isExpanded = expandedRows.has(article.id);
              const isSelected = selectedArticles.includes(article.id);

              return (
                <React.Fragment key={article.id}>
                  <TableRow className={cn("hover:bg-muted/50", isSelected && "bg-muted/30")}>
                    <TableCell>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked: boolean) => handleSelectRow(article.id, checked)}
                        aria-label={`Select ${article.title}`}
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {article.isFeatured && (
                          <Star className="h-3 w-3 text-yellow-500 fill-current" />
                        )}
                        {article.isPinned && <div className="h-3 w-3 bg-primary rounded-full" />}
                        <button
                          onClick={() => toggleRowExpansion(article.id)}
                          className="text-left hover:text-primary transition-colors flex items-center gap-1"
                        >
                          <span className="truncate max-w-[200px]" title={article.title}>
                            {article.title}
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
                          {ARTICLE_TYPE_DISPLAY[article.type].name}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <StatusIcon className="h-4 w-4 text-muted-foreground" />
                        <Badge
                          variant={ARTICLE_STATUS_DISPLAY[article.status].badgeVariant}
                          className="text-xs"
                        >
                          {ARTICLE_STATUS_DISPLAY[article.status].name}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center">
                          <User className="h-3 w-3 text-muted-foreground" />
                        </div>
                        <span
                          className="text-sm truncate max-w-[100px]"
                          title={article.author.name}
                        >
                          {article.author.name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <CategoryIcon className="h-4 w-4 text-muted-foreground" />
                        <Badge variant="outline" className="text-xs">
                          {ARTICLE_CATEGORY_DISPLAY[article.category].name}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <DifficultyIcon className="h-4 w-4 text-muted-foreground" />
                        <Badge variant="outline" className="text-xs">
                          {ARTICLE_DIFFICULTY_DISPLAY[article.difficulty].name}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{formatDate(article.publishedAt)}</TableCell>
                    <TableCell className="text-right text-sm">
                      {formatNumber(article.metrics.views)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span
                          className={cn(
                            "text-sm font-medium",
                            getEngagementColor(article.metrics.engagementScore),
                          )}
                        >
                          {article.metrics.engagementScore}
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
                          <DropdownMenuItem onClick={() => onViewDetails(article)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onEdit(article)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onDuplicate(article)}>
                            <Copy className="mr-2 h-4 w-4" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {article.status === "draft" && (
                            <DropdownMenuItem onClick={() => onPublish(article)}>
                              <CheckCircle2 className="mr-2 h-4 w-4" />
                              Publish
                            </DropdownMenuItem>
                          )}
                          {article.status === "published" && (
                            <DropdownMenuItem onClick={() => onArchive(article)}>
                              <Archive className="mr-2 h-4 w-4" />
                              Archive
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => window.open(`/articles/${article.slug}`, "_blank")}
                          >
                            <Share2 className="mr-2 h-4 w-4" />
                            Share
                          </DropdownMenuItem>
                          {article.downloadEnabled && (
                            <DropdownMenuItem>
                              <Download className="mr-2 h-4 w-4" />
                              Download
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => onDelete(article)}
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
                              {article.excerpt}
                            </p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              <span>{article.readTime} min read</span>
                              <span>•</span>
                              <span>{article.wordCount} words</span>
                              <span>•</span>
                              <span>{ARTICLE_DIFFICULTY_DISPLAY[article.difficulty].name}</span>
                            </div>
                          </div>
                          <div>
                            <h4 className="font-medium mb-2">Metrics</h4>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div className="flex items-center gap-2">
                                <Eye className="h-3 w-3 text-muted-foreground" />
                                <span>{formatNumber(article.metrics.views)} views</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Share2 className="h-3 w-3 text-muted-foreground" />
                                <span>{formatNumber(article.metrics.shares)} shares</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Timer className="h-3 w-3 text-muted-foreground" />
                                <span>{article.metrics.averageReadTime} min avg read</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <TrendingUp className="h-3 w-3 text-muted-foreground" />
                                <span>{article.metrics.engagementScore} engagement</span>
                              </div>
                            </div>
                            {article.tags.length > 0 && (
                              <div className="mt-3">
                                <h5 className="text-xs font-medium mb-2">Tags</h5>
                                <div className="flex flex-wrap gap-1">
                                  {article.tags.map((tag) => (
                                    <Badge
                                      key={tag.id}
                                      variant="secondary"
                                      className="text-xs"
                                      style={{
                                        backgroundColor: `${tag.color}20`,
                                        color: tag.color,
                                      }}
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

      {articles.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-40" />
          <h3 className="text-lg font-medium mb-2">No articles found</h3>
          <p className="text-sm">
            Try adjusting your filters or create a new article to get started.
          </p>
        </div>
      )}
    </div>
  );
}
