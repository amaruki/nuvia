/**
 * Permission Matrix Icons
 *
 * Module-to-icon mapping shared by the grid and table views.
 */

import type { ReactNode } from "react";
import {
  BarChart,
  BookOpen,
  Briefcase,
  Building,
  Calendar,
  DollarSign,
  FileText,
  Mail,
  MessageSquare,
  Settings,
  Shield,
  Users,
} from "lucide-react";

// Get permission icon
export const getPermissionIcon = (module: string): ReactNode => {
  const iconMap: Record<string, ReactNode> = {
    users: <Users className="h-4 w-4" />,
    events: <Calendar className="h-4 w-4" />,
    finance: <DollarSign className="h-4 w-4" />,
    content: <FileText className="h-4 w-4" />,
    communications: <Mail className="h-4 w-4" />,
    analytics: <BarChart className="h-4 w-4" />,
    organization: <Building className="h-4 w-4" />,
    forum: <MessageSquare className="h-4 w-4" />,
    jobs: <Briefcase className="h-4 w-4" />,
    learning: <BookOpen className="h-4 w-4" />,
    system: <Settings className="h-4 w-4" />,
    memberships: <Users className="h-4 w-4" />,
  };
  return iconMap[module] || <Shield className="h-4 w-4" />;
};
