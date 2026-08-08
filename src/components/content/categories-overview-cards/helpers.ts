import {
  Archive,
  Book,
  Briefcase,
  Building,
  Calendar,
  CheckCircle,
  FileText,
  Folder,
  FolderOpen,
  Globe,
  Megaphone,
  MessageSquare,
  PauseCircle,
  Users,
} from "lucide-react";

export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat("en-US").format(num);
};

// Helper function to get type icon
export const getTypeIcon = (type: string) => {
  const iconMap = {
    content: FileText,
    article: FileText,
    announcement: Megaphone,
    publication: Book,
    event: Calendar,
    forum: MessageSquare,
    job: Briefcase,
    resource: FolderOpen,
  };
  return iconMap[type as keyof typeof iconMap] || Folder;
};

export const getScopeIcon = (scope: string) => {
  switch (scope) {
    case "global":
      return Globe;
    case "chapter":
      return Building;
    case "committee":
      return Users;
    default:
      return Globe;
  }
};

export const getStatusIcon = (status: string) => {
  switch (status) {
    case "active":
      return CheckCircle;
    case "inactive":
      return PauseCircle;
    case "archived":
      return Archive;
    default:
      return CheckCircle;
  }
};

export const getStatusColor = (status: string) => {
  switch (status) {
    case "active":
      return "text-emerald-600";
    case "inactive":
      return "text-amber-600";
    case "archived":
      return "text-slate-600";
    default:
      return "text-emerald-600";
  }
};
