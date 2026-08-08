import {
  Archive,
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
  Timer,
  TrendingUp,
  User,
  Zap,
} from "lucide-react";

export const getTypeIcon = (type: string) => {
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

export const getCategoryIcon = (category: string) => {
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

export const getDifficultyIcon = (difficulty: string) => {
  const iconMap = {
    beginner: Star,
    intermediate: Timer,
    advanced: Zap,
  };
  return iconMap[difficulty as keyof typeof iconMap] || Star;
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
