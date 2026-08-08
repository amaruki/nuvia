import {
  Archive,
  BarChart3,
  BookOpen,
  Briefcase,
  Building,
  Calendar,
  CheckCircle2,
  Clock,
  Edit,
  FileText,
  GraduationCap,
  Mail,
  Megaphone,
  Microscope,
  Star,
  TrendingUp,
} from "lucide-react";

export const getTypeIcon = (type: string) => {
  const iconMap = {
    article: FileText,
    blog: Edit,
    newsletter: Mail,
    report: BarChart3,
    case_study: Briefcase,
    whitepaper: BookOpen,
    research_paper: Microscope,
  };
  return iconMap[type as keyof typeof iconMap] || FileText;
};

export const getCategoryIcon = (category: string) => {
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
    chapter_news: Building,
  };
  return iconMap[category as keyof typeof iconMap] || FileText;
};

export const getStatusIcon = (status: string) => {
  const iconMap = {
    draft: Edit,
    review: Clock,
    published: CheckCircle2,
    archived: Archive,
    scheduled: Calendar,
  };
  return iconMap[status as keyof typeof iconMap] || Clock;
};
