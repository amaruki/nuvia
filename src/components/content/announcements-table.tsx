"use client";

import { useState } from "react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Trash2, 
  Copy, 
  ExternalLink,
  Calendar,
  Users,
  AlertTriangle,
  Bell,
  Star,
  Clock,
  CheckCircle2,
  Archive,
  Pin,
  Zap,
  Target,
  Shield,
  Gift
} from "lucide-react";
import { Announcement } from "@/types/announcement.types";
import { ArticleStatus } from "@/types/article.types";
import { formatDistanceToNow } from "date-fns";

interface AnnouncementsTableProps {
  announcements: Announcement[];
  onView?: (announcement: Announcement) => void;
  onEdit?: (announcement: Announcement) => void;
  onDelete?: (announcement: Announcement) => void;
  onDuplicate?: (announcement: Announcement) => void;
  onStatusChange?: (announcement: Announcement, status: ArticleStatus) => void;
}

export function AnnouncementsTable({
  announcements,
  onView,
  onEdit,
  onDelete,
  onDuplicate,
  onStatusChange,
}: AnnouncementsTableProps) {
  const [selectedAnnouncements, setSelectedAnnouncements] = useState<string[]>([]);

  const getStatusBadge = (status: ArticleStatus) => {
    const statusConfig: Record<ArticleStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: any }> = {
      draft: { label: "Draft", variant: "secondary", icon: Clock },
      published: { label: "Published", variant: "default", icon: CheckCircle2 },
      scheduled: { label: "Scheduled", variant: "outline", icon: Calendar },
      review: { label: "Under Review", variant: "outline", icon: Eye },
      archived: { label: "Archived", variant: "secondary", icon: Archive },
    };

    const config = statusConfig[status];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      urgent: { label: "Urgent", variant: "destructive" as const, icon: AlertTriangle },
      high: { label: "High", variant: "default" as const, icon: Bell },
      medium: { label: "Medium", variant: "secondary" as const, icon: Star },
      low: { label: "Low", variant: "outline" as const, icon: Clock },
    };

    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.low;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getTypeIcon = (type: string) => {
    const typeIcons = {
      general: Bell,
      event: Calendar,
      policy: Shield,
      maintenance: Zap,
      holiday: Gift,
      reminder: Clock,
      urgent: AlertTriangle,
      update: Target,
      banner: Gift,
      feature: Star,
      security: Shield,
      celebration: Star,
      emergency: AlertTriangle,
    };

    const Icon = typeIcons[type as keyof typeof typeIcons] || Bell;
    return <Icon className="h-4 w-4" />;
  };

  const getTargetAudienceIcon = (audience: string) => {
    const audienceIcons = {
      all_members: Users,
      chapter_admins: Shield,
      staff_only: Shield,
      public: Users,
      premium_members: Star,
    };

    const Icon = audienceIcons[audience as keyof typeof audienceIcons] || Users;
    return <Icon className="h-4 w-4" />;
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "N/A";
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };

  const isExpired = (expiresAt: Date | string | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedAnnouncements(announcements.map(a => a.id));
    } else {
      setSelectedAnnouncements([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedAnnouncements([...selectedAnnouncements, id]);
    } else {
      setSelectedAnnouncements(selectedAnnouncements.filter(selectedId => selectedId !== id));
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">
              <input
                type="checkbox"
                className="rounded border-gray-300"
                checked={selectedAnnouncements.length === announcements.length}
                onChange={(e) => handleSelectAll(e.target.checked)}
              />
            </TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Target Audience</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Author</TableHead>
            <TableHead>Acknowledgments</TableHead>
            <TableHead>Expires</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {announcements.map((announcement) => (
            <TableRow key={announcement.id} className="hover:bg-muted/50">
              <TableCell>
                <input
                  type="checkbox"
                  className="rounded border-gray-300"
                  checked={selectedAnnouncements.includes(announcement.id)}
                  onChange={(e) => handleSelectOne(announcement.id, e.target.checked)}
                />
              </TableCell>
              <TableCell>
                <div className="max-w-[200px]">
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">{announcement.title}</p>
                    {announcement.isPinned && (
                      <Pin className="h-3 w-3 text-primary" fill="currentColor" />
                    )}
                    {announcement.isUrgent && (
                      <Zap className="h-3 w-3 text-red-500" />
                    )}
                  </div>
                  {isExpired(announcement.expiresAt || null) && (
                    <p className="text-xs text-red-500 mt-1">Expired</p>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {getTypeIcon(announcement.type)}
                  <span className="capitalize text-sm">
                    {announcement.type?.replace('_', ' ')}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                {getPriorityBadge(announcement.priority)}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {getTargetAudienceIcon(announcement.targetAudience)}
                  <span className="capitalize text-sm">
                    {announcement.targetAudience?.replace('_', ' ')}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                {getStatusBadge(announcement.status)}
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{announcement.author.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(announcement.lastModified)}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">
                    {announcement.acknowledgmentCount || 0}
                  </span>
                  {announcement.requiresAcknowledgment && (
                    <span className="text-xs text-muted-foreground">
                      Required
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className={`text-sm ${
                    isExpired(announcement.expiresAt || null) ? 'text-red-500 font-medium' : ''
                  }`}>
                    {formatDate(announcement.expiresAt || null)}
                  </span>
                  {announcement.expiresAt && !isExpired(announcement.expiresAt || null) && (
                    <span className="text-xs text-muted-foreground">
                      {Math.ceil((new Date(announcement.expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days left
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem
                      onClick={() => onView?.(announcement)}
                      className="flex items-center gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onEdit?.(announcement)}
                      className="flex items-center gap-2"
                    >
                      <Edit className="h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onDuplicate?.(announcement)}
                      className="flex items-center gap-2"
                    >
                      <Copy className="h-4 w-4" />
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {announcement.status === 'draft' && (
                      <DropdownMenuItem
                        onClick={() => onStatusChange?.(announcement, 'published')}
                        className="flex items-center gap-2"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Publish
                      </DropdownMenuItem>
                    )}
                    {announcement.status === 'published' && (
                      <DropdownMenuItem
                        onClick={() => onStatusChange?.(announcement, 'archived')}
                        className="flex items-center gap-2"
                      >
                        <Archive className="h-4 w-4" />
                        Archive
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onDelete?.(announcement)}
                      className="flex items-center gap-2 text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}