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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import {
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Users,
  Power,
  PowerOff,
  Calendar,
  FileText,
  MessageSquare,
  CheckSquare,
  TrendingUp,
  TrendingDown,
  UserPlus,
  Settings,
  ExternalLink,
  FolderOpen,
  Activity,
  Target,
} from "lucide-react";
import { CommitteeWorkspace } from "@/types/committee.types";
import { formatDistanceToNow } from "date-fns";

interface WorkspacesTableProps {
  workspaces: CommitteeWorkspace[];
  onViewDetails: (workspace: CommitteeWorkspace) => void;
  onEdit: (workspace: CommitteeWorkspace) => void;
  onDelete: (workspace: CommitteeWorkspace) => void;
  onToggleStatus: (workspace: CommitteeWorkspace, status: "active" | "archived") => void;
}

export function WorkspacesTable({
  workspaces,
  onViewDetails,
  onEdit,
  onDelete,
  onToggleStatus,
}: WorkspacesTableProps) {
  const [togglingWorkspace, setTogglingWorkspace] = useState<string | null>(null);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckSquare className="h-4 w-4 text-emerald-500" />;
      case "archived":
        return <FolderOpen className="h-4 w-4 text-slate-500" />;
      case "locked":
        return <Target className="h-4 w-4 text-rose-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: "default" as const,
      archived: "secondary" as const,
      locked: "destructive" as const,
    };

    return (
      <Badge variant={variants[status as keyof typeof variants] || "secondary"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    const colors = {
      general: "bg-blue-100 text-blue-800 border-blue-200",
      project: "bg-purple-100 text-purple-800 border-purple-200",
      document: "bg-green-100 text-green-800 border-green-200",
      discussion: "bg-orange-100 text-orange-800 border-orange-200",
      meeting: "bg-indigo-100 text-indigo-800 border-indigo-200",
    };

    return (
      <Badge
        variant="outline"
        className={
          colors[type as keyof typeof colors] || "bg-gray-100 text-gray-800 border-gray-200"
        }
      >
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </Badge>
    );
  };

  const getGrowthIcon = (rate: number) => {
    return rate >= 0 ? (
      <TrendingUp className="h-4 w-4 text-emerald-500" />
    ) : (
      <TrendingDown className="h-4 w-4 text-rose-500" />
    );
  };

  const getGrowthColor = (rate: number) => {
    return rate >= 0 ? "text-emerald-600" : "text-rose-600";
  };

  const handleToggleStatus = async (
    workspace: CommitteeWorkspace,
    status: "active" | "archived",
  ) => {
    setTogglingWorkspace(workspace.id);
    try {
      await onToggleStatus(workspace, status);
    } finally {
      setTogglingWorkspace(null);
    }
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Workspace</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Members</TableHead>
            <TableHead>Documents</TableHead>
            <TableHead>Tasks</TableHead>
            <TableHead>Discussions</TableHead>
            <TableHead>Meetings</TableHead>
            <TableHead>Activity</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {workspaces.map((workspace) => (
            <TableRow key={workspace.id} className="hover:bg-muted/50">
              <TableCell>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
                    {getStatusIcon(workspace.status)}
                  </div>
                  <div>
                    <div className="font-medium">{workspace.name}</div>
                    <div className="text-sm text-muted-foreground">
                      Created {formatDistanceToNow(workspace.createdAt, { addSuffix: true })}
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {getTypeBadge(workspace.type)}
                  <div className="text-xs text-muted-foreground">
                    {workspace.settings.isPublic ? "Public" : "Private"}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-2">
                  {getStatusBadge(workspace.status)}
                </div>
              </TableCell>
              <TableCell>
                <div>
                  <div className="font-medium">{workspace.members.length}</div>
                  <div className="text-sm text-muted-foreground">
                    {workspace.members.filter((m) => m.isActive).length} active
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div>
                  <div className="font-medium">{workspace.documents.length}</div>
                  <div className="text-sm text-muted-foreground">
                    {workspace.documents.length > 0
                      ? formatFileSize(
                          workspace.documents.reduce((sum, doc) => sum + doc.fileSize, 0),
                        )
                      : "0 Bytes"}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div>
                  <div className="font-medium">{workspace.tasks.length}</div>
                  <div className="text-sm text-muted-foreground">
                    {workspace.tasks.filter((t) => t.status === "completed").length} completed
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div>
                  <div className="font-medium">{workspace.discussions.length}</div>
                  <div className="text-sm text-muted-foreground">
                    {workspace.discussions.reduce((sum, d) => sum + d.replyCount, 0)} replies
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div>
                  <div className="font-medium">{workspace.meetings.length}</div>
                  <div className="text-sm text-muted-foreground">
                    {workspace.meetings.filter((m) => m.status === "completed").length} completed
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-2">
                  <Activity className="h-4 w-4 text-amber-500" />
                  <span className="font-medium">{workspace.activity.length}</span>
                  <span className="text-xs text-muted-foreground">activities</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-1">
                  {workspace.members.slice(0, 3).map((member, index) => (
                    <Avatar key={member.id} className="h-6 w-6 border-2 border-background">
                      <AvatarImage src={member.avatar} alt={member.name} />
                      <AvatarFallback className="text-xs">
                        {member.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                  {workspace.members.length > 3 && (
                    <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                      +{workspace.members.length - 3}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onViewDetails(workspace)}>
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEdit(workspace)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <a
                        href={`/dashboard/organization/committees/${workspace.committeeId}/workspace`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Open Workspace
                      </a>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() =>
                        handleToggleStatus(
                          workspace,
                          workspace.status === "active" ? "archived" : "active",
                        )
                      }
                      disabled={togglingWorkspace === workspace.id}
                    >
                      {workspace.status === "active" ? (
                        <>
                          <PowerOff className="mr-2 h-4 w-4" />
                          Archive
                        </>
                      ) : (
                        <>
                          <Power className="mr-2 h-4 w-4" />
                          Activate
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onDelete(workspace)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
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
