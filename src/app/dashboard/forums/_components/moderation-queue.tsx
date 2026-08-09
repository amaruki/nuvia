"use client";

import React, { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Check, Eye, Filter, RefreshCw, Shield, User, X } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { ForumLayout } from "./forum-layout";
import { DataTable, DataTablePagination, useDataTableState } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ForumPost } from "@/types/forum.types";
import { useModeratePost, useModerationQueue } from "@/lib/hooks/use-forums";
import { logger } from "@/lib/logger";

export function ModerationQueue() {
  const { state, setPage, setPageSize } = useDataTableState();
  const {
    data: queuePage,
    isLoading,
    isFetching,
    refetch,
  } = useModerationQueue(state.page, state.pageSize);
  const queue = queuePage?.items ?? [];
  const totalPages = Math.max(1, queuePage?.totalPages ?? 1);

  const moderatePost = useModeratePost();
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; postId: string | null }>({
    open: false,
    postId: null,
  });
  const [rejectReason, setRejectReason] = useState("Violation of community guidelines");
  // Client-side view over the loaded page (the queue endpoint has no risk filter).
  const [filter, setFilter] = useState("all");
  const [viewPost, setViewPost] = useState<ForumPost | null>(null);

  const posts = queue.filter((post) => {
    if (filter === "reported") return post.reportCount > 0;
    if (filter === "high_risk") return post.reportCount >= 2;
    return true;
  });

  const handleApprove = (id: string) => {
    moderatePost.mutate(
      { postId: id, action: "approve" },
      {
        onError: (error) => logger.error("Failed to approve post", error),
      },
    );
  };

  const openRejectDialog = (id: string) => {
    setRejectDialog({ open: true, postId: id });
  };

  const handleReject = () => {
    if (rejectDialog.postId) {
      moderatePost.mutate(
        { postId: rejectDialog.postId, action: "reject", reason: rejectReason },
        {
          onError: (error) => logger.error("Failed to reject post", error),
        },
      );
    }
    setRejectDialog({ open: false, postId: null });
    setRejectReason("Violation of community guidelines");
  };

  const columns: ColumnDef<ForumPost>[] = [
    {
      id: "author",
      accessorFn: (row) => row.author.name,
      header: "Author",
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <Avatar className="size-10 ring-2 ring-background">
            <AvatarImage src={row.original.author.avatar} />
            <AvatarFallback>
              <User className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="text-sm font-semibold leading-none">{row.original.author.name}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Posted in{" "}
              <span className="font-medium text-foreground">{row.original.category.name}</span> •{" "}
              {formatDistanceToNow(new Date(row.original.createdAt))} ago
            </p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "title",
      header: "Content",
      enableSorting: false,
      cell: ({ row }) => (
        <div className="max-w-md">
          <div className="font-medium">{row.original.title}</div>
          <div className="truncate text-sm text-muted-foreground">{row.original.content}</div>
        </div>
      ),
    },
    {
      accessorKey: "reportCount",
      header: () => <span className="block text-right">Reports</span>,
      enableSorting: false,
      cell: ({ row }) => (
        <div className="text-right">
          <Badge
            variant="outline"
            className={
              row.original.reportCount > 0
                ? "bg-orange-100 text-orange-700 border-orange-200 font-medium"
                : "text-muted-foreground"
            }
          >
            {row.original.reportCount}
          </Badge>
        </div>
      ),
    },
    {
      id: "actions",
      header: () => <span className="block text-right">Actions</span>,
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => (
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="icon"
            aria-label={`View post: ${row.original.title}`}
            onClick={() => setViewPost(row.original)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20 gap-2"
            onClick={() => openRejectDialog(row.original.id)}
          >
            <X className="h-4 w-4" />
            Reject
          </Button>
          <Button
            size="sm"
            className="bg-green-600 hover:bg-green-700 text-white gap-2"
            onClick={() => handleApprove(row.original.id)}
          >
            <Check className="h-4 w-4" />
            Approve
          </Button>
        </div>
      ),
    },
  ];

  return (
    <ForumLayout
      title="Moderation Queue"
      description="Review and manage pending user content."
      total={queuePage?.total ?? 0}
      actions={
        <div className="flex items-center gap-2">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Pending</SelectItem>
              <SelectItem value="reported">Reported Only</SelectItem>
              <SelectItem value="high_risk">High Risk</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => void refetch()} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      }
    >
      <DataTable
        columns={columns}
        data={posts}
        loading={isLoading}
        caption="Posts awaiting moderation review"
        manualSorting
        getRowId={(post) => post.id}
        emptyTitle="All caught up!"
        emptyDescription="There is no content pending moderation at this time."
        emptyIcon={<Shield className="size-8 text-muted-foreground" />}
        pagination={
          <DataTablePagination
            page={Math.min(state.page, totalPages)}
            pageCount={totalPages}
            total={queuePage?.total ?? 0}
            pageSize={state.pageSize}
            loading={isFetching}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        }
      />

      {/* Full-content review dialog */}
      <Dialog open={viewPost !== null} onOpenChange={(open) => !open && setViewPost(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{viewPost?.title}</DialogTitle>
            <DialogDescription>
              {viewPost &&
                `By ${viewPost.author.name} in ${viewPost.category.name} • ${formatDistanceToNow(
                  new Date(viewPost.createdAt),
                )} ago`}
            </DialogDescription>
          </DialogHeader>
          {viewPost && (
            <div className="p-4 bg-muted/10 rounded-md text-sm leading-relaxed border border-muted/20 max-h-[40vh] overflow-y-auto">
              {viewPost.content}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewPost(null)}>
              Close
            </Button>
            {viewPost && (
              <>
                <Button
                  variant="outline"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20"
                  onClick={() => {
                    openRejectDialog(viewPost.id);
                    setViewPost(null);
                  }}
                >
                  Reject
                </Button>
                <Button
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => {
                    handleApprove(viewPost.id);
                    setViewPost(null);
                  }}
                >
                  Approve
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={rejectDialog.open}
        onOpenChange={(open) => !open && setRejectDialog({ open: false, postId: null })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Content</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this post. The user will be notified.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="reason">Reason</Label>
              <Select value={rejectReason} onValueChange={setRejectReason}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Violation of community guidelines">
                    Violation of community guidelines
                  </SelectItem>
                  <SelectItem value="Spam or promotional content">
                    Spam or promotional content
                  </SelectItem>
                  <SelectItem value="Harassment or hate speech">
                    Harassment or hate speech
                  </SelectItem>
                  <SelectItem value="Off-topic">Off-topic</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {rejectReason === "Other" && (
              <div className="grid gap-2">
                <Label htmlFor="custom-reason">Custom Reason</Label>
                <Textarea placeholder="Type your reason here..." />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectDialog({ open: false, postId: null })}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject}>
              Reject Post
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ForumLayout>
  );
}
