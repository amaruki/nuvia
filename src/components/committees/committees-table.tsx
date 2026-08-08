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
  Target,
  TrendingUp,
  TrendingDown,
  UserPlus,
  Settings,
  ExternalLink,
  CheckSquare,
  Clock,
  AlertTriangle,
  Briefcase,
  Award,
} from "lucide-react";
import { Committee } from "@/types/committee";
import { formatDistanceToNow } from "date-fns";

interface CommitteesTableProps {
  committees: Committee[];
  onViewDetails: (committee: Committee) => void;
  onEdit: (committee: Committee) => void;
  onDelete: (committee: Committee) => void;
  onToggleStatus: (committee: Committee, status: "active" | "inactive") => void;
}

export function CommitteesTable({
  committees,
  onViewDetails,
  onEdit,
  onDelete,
  onToggleStatus,
}: CommitteesTableProps) {
  const [togglingCommittee, setTogglingCommittee] = useState<string | null>(null);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckSquare className="h-4 w-4 text-emerald-500" />;
      case "inactive":
        return <Briefcase className="h-4 w-4 text-rose-500" />;
      case "pending":
        return <Clock className="h-4 w-4 text-amber-500" />;
      case "suspended":
        return <AlertTriangle className="h-4 w-4 text-rose-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: "default" as const,
      inactive: "secondary" as const,
      pending: "outline" as const,
      suspended: "destructive" as const,
    };

    return (
      <Badge variant={variants[status as keyof typeof variants] || "secondary"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    const colors = {
      executive: "bg-purple-100 text-purple-800 border-purple-200",
      functional: "bg-blue-100 text-blue-800 border-blue-200",
      special_interest: "bg-green-100 text-green-800 border-green-200",
      ad_hoc: "bg-orange-100 text-orange-800 border-orange-200",
      standing: "bg-indigo-100 text-indigo-800 border-indigo-200",
    };

    return (
      <Badge
        variant="outline"
        className={
          colors[type as keyof typeof colors] || "bg-gray-100 text-gray-800 border-gray-200"
        }
      >
        {type.replace("_", " ").charAt(0).toUpperCase() + type.replace("_", " ").slice(1)}
      </Badge>
    );
  };

  const getAuthorityBadge = (authority: string) => {
    const variants = {
      executive: "default" as const,
      strategic: "secondary" as const,
      operational: "outline" as const,
      advisory: "destructive" as const,
    };

    return (
      <Badge variant={variants[authority as keyof typeof variants] || "secondary"}>
        {authority.charAt(0).toUpperCase() + authority.slice(1)}
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

  const handleToggleStatus = async (committee: Committee, status: "active" | "inactive") => {
    setTogglingCommittee(committee.id);
    try {
      await onToggleStatus(committee, status);
    } finally {
      setTogglingCommittee(null);
    }
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Committee</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Members</TableHead>
            <TableHead>Attendance</TableHead>
            <TableHead>Goals</TableHead>
            <TableHead>Deliverables</TableHead>
            <TableHead>Impact</TableHead>
            <TableHead>Leadership</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {committees.map((committee) => (
            <TableRow key={committee.id} className="hover:bg-muted/50">
              <TableCell>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
                    {getStatusIcon(committee.status)}
                  </div>
                  <div>
                    <div className="font-medium">{committee.displayName}</div>
                    <div className="text-sm text-muted-foreground">
                      Created {formatDistanceToNow(committee.createdAt, { addSuffix: true })}
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {getTypeBadge(committee.type)}
                  <div className="text-xs text-muted-foreground">
                    {getAuthorityBadge(committee.charter.authorityLevel)}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-2">
                  {getStatusBadge(committee.status)}
                </div>
              </TableCell>
              <TableCell>
                <div>
                  <div className="font-medium">{committee.metrics.memberCount}</div>
                  <div className="text-sm text-muted-foreground">
                    {committee.metrics.activeMembersCount} active
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-2">
                  <span
                    className={`font-medium ${getGrowthColor(committee.metrics.meetingAttendanceRate - 80)}`}
                  >
                    {formatPercentage(committee.metrics.meetingAttendanceRate)}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-2">
                  {getGrowthIcon(committee.metrics.goalCompletionRate - 75)}
                  <span
                    className={`font-medium ${getGrowthColor(committee.metrics.goalCompletionRate - 75)}`}
                  >
                    {formatPercentage(committee.metrics.goalCompletionRate)}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <div>
                  <div className="font-medium">{committee.metrics.deliverablesCount}</div>
                  <div className="text-sm text-muted-foreground">Total</div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-2">
                  <Award className="h-4 w-4 text-amber-500" />
                  <span className="font-medium">{committee.metrics.impactScore.toFixed(1)}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-1">
                  {committee.leadership.slice(0, 3).map((leader, index) => (
                    <Avatar key={leader.id} className="h-6 w-6 border-2 border-background">
                      <AvatarImage src={leader.avatar} alt={leader.name} />
                      <AvatarFallback className="text-xs">
                        {leader.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                  {committee.leadership.length > 3 && (
                    <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                      +{committee.leadership.length - 3}
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
                    <DropdownMenuItem onClick={() => onViewDetails(committee)}>
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEdit(committee)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <a
                        href={committee.contactInfo.website}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Visit Website
                      </a>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() =>
                        handleToggleStatus(
                          committee,
                          committee.status === "active" ? "inactive" : "active",
                        )
                      }
                      disabled={togglingCommittee === committee.id}
                    >
                      {committee.status === "active" ? (
                        <>
                          <PowerOff className="mr-2 h-4 w-4" />
                          Deactivate
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
                      onClick={() => onDelete(committee)}
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
