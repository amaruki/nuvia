"use client";

import React, { useState, useEffect } from "react";
import { ForumLayout } from "./forum-layout";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Check, X, AlertTriangle, User, Shield, RefreshCw, Filter } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getMockModerationQueue, ForumPost } from "@/lib/data/mock-forums";
import { formatDistanceToNow } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export function ModerationQueue() {
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; postId: string | null }>({
    open: false,
    postId: null,
  });
  const [rejectReason, setRejectReason] = useState("Violation of community guidelines");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    loadQueue();
  }, []);

  const loadQueue = async () => {
    setIsLoading(true);
    try {
      const data = await getMockModerationQueue();
      setPosts(data);
    } catch (error) {
      console.error("Failed to load moderation queue", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = (id: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== id));
    // In real app, call approve API
  };

  const openRejectDialog = (id: string) => {
    setRejectDialog({ open: true, postId: id });
  };

  const handleReject = () => {
    if (rejectDialog.postId) {
      setPosts((prev) => prev.filter((p) => p.id !== rejectDialog.postId));
      // In real app, call reject API with reason
    }
    setRejectDialog({ open: false, postId: null });
    setRejectReason("Violation of community guidelines");
  };

  return (
    <ForumLayout
      title="Moderation Queue"
      description="Review and manage pending user content."
      total={posts.length}
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
          <Button variant="outline" onClick={loadQueue} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      }
    >
      {isLoading ? (
        <div className="grid gap-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="animate-pulse border-l-4 border-l-muted">
              <CardHeader className="h-20 bg-muted/20" />
              <CardContent className="h-32 bg-muted/10" />
            </Card>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-12">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="flex items-center justify-center size-16 rounded-full bg-muted/50 mb-4">
                <Shield className="size-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">All caught up!</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                There is no content pending moderation at this time.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5">
          {posts.map((post) => (
            <Card
              key={post.id}
              className="overflow-hidden border-l-4 border-l-orange-400 hover:shadow-md transition-shadow"
            >
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3 bg-muted/5">
                <div className="flex items-center gap-3">
                  <Avatar className="size-10 ring-2 ring-background">
                    <AvatarImage src={post.author.avatar} />
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-base font-semibold leading-none">
                      {post.author.name}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">
                      Posted in{" "}
                      <span className="font-medium text-foreground">{post.category.name}</span> •{" "}
                      {formatDistanceToNow(new Date(post.createdAt))} ago
                    </p>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className="bg-orange-100 text-orange-700 border-orange-200 font-medium"
                >
                  Pending Review
                </Badge>
              </CardHeader>
              <CardContent className="pt-4">
                <h4 className="text-md font-semibold mb-3">{post.title}</h4>
                <div className="p-4 bg-muted/10 rounded-md text-sm leading-relaxed border border-muted/20">
                  {post.content}
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2 bg-muted/5 py-3">
                <Button
                  variant="outline"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20 gap-2"
                  onClick={() => openRejectDialog(post.id)}
                >
                  <X className="h-4 w-4" />
                  Reject
                </Button>
                <Button
                  className="bg-green-600 hover:bg-green-700 text-white gap-2"
                  onClick={() => handleApprove(post.id)}
                >
                  <Check className="h-4 w-4" />
                  Approve
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

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
