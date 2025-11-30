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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
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
  MapPin,
  Calendar,
  TrendingUp,
  TrendingDown,
  UserPlus,
  Settings,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { Chapter } from "@/types/chapter.types";
import { formatDistanceToNow } from "date-fns";

interface ChaptersTableProps {
  chapters: Chapter[];
  onViewDetails: (chapter: Chapter) => void;
  onEdit: (chapter: Chapter) => void;
  onDelete: (chapter: Chapter) => void;
  onToggleStatus: (chapter: Chapter, status: "active" | "inactive") => void;
}

export function ChaptersTable({
  chapters,
  onViewDetails,
  onEdit,
  onDelete,
  onToggleStatus,
}: ChaptersTableProps) {
  const [togglingChapter, setTogglingChapter] = useState<string | null>(null);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case "inactive":
        return <XCircle className="h-4 w-4 text-rose-500" />;
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

  const getFinancialHealthBadge = (health: string) => {
    const variants = {
      excellent: "default" as const,
      good: "secondary" as const,
      fair: "outline" as const,
      poor: "destructive" as const,
    };
    
    return (
      <Badge variant={variants[health as keyof typeof variants] || "secondary"}>
        {health.charAt(0).toUpperCase() + health.slice(1)}
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

  const handleToggleStatus = async (chapter: Chapter, status: "active" | "inactive") => {
    setTogglingChapter(chapter.id);
    try {
      await onToggleStatus(chapter, status);
    } finally {
      setTogglingChapter(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Chapter</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Members</TableHead>
            <TableHead>Growth</TableHead>
            <TableHead>Events</TableHead>
            <TableHead>Revenue</TableHead>
            <TableHead>Financial Health</TableHead>
            <TableHead>Leadership</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {chapters.map((chapter) => (
            <TableRow key={chapter.id} className="hover:bg-muted/50">
              <TableCell>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
                    {getStatusIcon(chapter.status)}
                  </div>
                  <div>
                    <div className="font-medium">{chapter.displayName}</div>
                    <div className="text-sm text-muted-foreground">
                      Established {formatDistanceToNow(chapter.establishedDate, { addSuffix: true })}
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">{chapter.location.city}, {chapter.location.state}</div>
                    <div className="text-sm text-muted-foreground">
                      {chapter.location.region} • {chapter.location.country}
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-2">
                  {getStatusBadge(chapter.status)}
                </div>
              </TableCell>
              <TableCell>
                <div>
                  <div className="font-medium">{chapter.memberCount.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">
                    {chapter.metrics.activeMembersThisMonth} active this month
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-2">
                  {getGrowthIcon(chapter.metrics.memberGrowthRate)}
                  <span className={`font-medium ${getGrowthColor(chapter.metrics.memberGrowthRate)}`}>
                    {formatPercentage(chapter.metrics.memberGrowthRate)}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <div>
                  <div className="font-medium">{chapter.events.length}</div>
                  <div className="text-sm text-muted-foreground">
                    {formatPercentage(chapter.metrics.eventAttendanceRate)} attendance
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div>
                  <div className="font-medium">{formatCurrency(chapter.finances.totalRevenue)}</div>
                  <div className="text-sm text-muted-foreground">
                    {formatCurrency(chapter.finances.netIncome)} net
                  </div>
                </div>
              </TableCell>
              <TableCell>
                {getFinancialHealthBadge(chapter.metrics.financialHealth)}
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-1">
                  {chapter.leadership.slice(0, 3).map((leader, index) => (
                    <Avatar key={leader.id} className="h-6 w-6 border-2 border-background">
                      <AvatarImage src={leader.avatar} alt={leader.name} />
                      <AvatarFallback className="text-xs">
                        {leader.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                  {chapter.leadership.length > 3 && (
                    <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                      +{chapter.leadership.length - 3}
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
                    <DropdownMenuItem onClick={() => onViewDetails(chapter)}>
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEdit(chapter)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <a href={chapter.contactInfo.website} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Visit Website
                      </a>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => handleToggleStatus(chapter, chapter.status === "active" ? "inactive" : "active")}
                      disabled={togglingChapter === chapter.id}
                    >
                      {chapter.status === "active" ? (
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
                      onClick={() => onDelete(chapter)}
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