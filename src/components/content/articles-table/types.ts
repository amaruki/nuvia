import type { Article } from "@/types/article";

export interface ArticlesTableProps {
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
