import type { ForumCategory } from "@/db/schema";

// ---------------------------------------------------------------------------
// DTOs
// ---------------------------------------------------------------------------

export interface AuthorDto {
  id: string;
  name: string;
  avatar?: string;
  role: string;
}

export interface CategoryDto extends ForumCategory {
  postCount: number;
  lastPostAt: Date | null;
}

export interface PostDto {
  id: string;
  categoryId: string;
  title: string;
  content: string;
  type: string;
  status: string;
  isSticky: boolean;
  isLocked: boolean;
  views: number;
  replyCount: number;
  lastReplyAt: Date | null;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  author: AuthorDto;
  category: { id: string; name: string };
}

/** Shape the moderation queue UI renders (author/category inlined). */
export interface QueuePostDto {
  id: string;
  title: string;
  content: string;
  author: AuthorDto;
  category: { id: string; name: string };
  status: string;
  createdAt: Date;
  reportCount: number;
}

export interface CommentDto {
  id: string;
  postId: string;
  parentId: string | null;
  content: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  author: AuthorDto;
}

export interface ReportDto {
  id: string;
  targetId: string;
  targetType: "POST" | "COMMENT";
  reason: string;
  status: string;
  reportedBy: { id: string; name: string };
  createdAt: Date;
  targetContent?: { title?: string; content: string };
}
