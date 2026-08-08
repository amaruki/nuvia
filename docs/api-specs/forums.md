# API Spec — Forums

Posts, comments, categories, moderation, and reports (backlog B5). Service
layer: `src/lib/services/forum/` (schemas and business rules live
there); `forumProblemFromError` maps `ForumServiceError` to its embedded
problem and anything unexpected to 500 `internal-error`.

> **Known divergence:** every forum success path double-wraps the envelope
> (`NextResponse.json(successResponse(...))`), so success bodies serialize as
> `{}` today — status codes and error paths are unaffected. See
> [`_index.md`](./_index.md#known-divergences). The tables below describe the
> intended contract as coded.

Route files: `src/app/api/v1/forums/**`. Permissions: `forum:read`,
`forum:create`, `forum:update`, `forum:delete`, `forum:moderate`.

## Categories — `src/app/api/v1/forums/categories/**`

| Method + Path                           | Permission     | Request                | Success                                                                    |
| --------------------------------------- | -------------- | ---------------------- | -------------------------------------------------------------------------- |
| GET `/api/v1/forums/categories`         | `forum:read`   | —                      | 200, category list with post counts                                        |
| POST `/api/v1/forums/categories`        | `forum:create` | `createCategorySchema` | 201, created category                                                      |
| GET `/api/v1/forums/categories/{id}`    | `forum:read`   | —                      | 200                                                                        |
| PATCH `/api/v1/forums/categories/{id}`  | `forum:update` | `updateCategorySchema` | 200                                                                        |
| DELETE `/api/v1/forums/categories/{id}` | `forum:delete` | —                      | 200 `{ id, deleted: true }` — hard delete, only when the category is empty |

`createCategorySchema`: `name` (1–120, required), optional `slug`
(`^[a-z0-9]+(?:-[a-z0-9]+)*$`, ≤100; derived from name when omitted),
`description` (≤2000), `icon` (≤64), `color` (≤32), `sortOrder` (0–10000),
`isActive`, `isPrivate`, `requiredRole` (role enum \| null — the
per-category role gate kept from B5), `parentId`. 400 `business-logic-error`
when the name cannot produce a slug; 409 `conflict` on slug collision.

## Posts — `src/app/api/v1/forums/posts/**`

| Method + Path                      | Permission     | Request                      | Success                                                                               |
| ---------------------------------- | -------------- | ---------------------------- | ------------------------------------------------------------------------------------- |
| GET `/api/v1/forums/posts`         | `forum:read`   | `listPostsQuerySchema` query | 200, paginated posts                                                                  |
| POST `/api/v1/forums/posts`        | `forum:create` | `createPostSchema`           | 201, created post                                                                     |
| GET `/api/v1/forums/posts/{id}`    | `forum:read`   | —                            | 200; 403 for unpublished posts unless the actor is superadmin or has `forum:moderate` |
| PATCH `/api/v1/forums/posts/{id}`  | `forum:update` | `updatePostSchema`           | 200                                                                                   |
| DELETE `/api/v1/forums/posts/{id}` | `forum:delete` | —                            | 200 `{ id, deleted: true }` — soft delete (status → `DELETED`)                        |

`listPostsQuerySchema`: `categoryId`, `status` (PostStatus enum), `authorId`,
`page` (≥1, default 1), `limit` (1–100, default 20).

`createPostSchema`: `categoryId` (required), `title` (1–300, required),
`content` (1–50000, required), `type` ∈ `DISCUSSION`, `QUESTION`,
`ANNOUNCEMENT`, `POLL`, `RESOURCE`, `JOB_POSTING`, `EVENT_PROMOTION` (default
`DISCUSSION`), `status`, `tags` (≤20 × ≤64). **Status derivation:** `DRAFT`
stays a draft; superadmin / `forum:moderate` actors publish directly
(default `PUBLISHED`); everyone else lands in `PENDING_REVIEW` — that is
what feeds the moderation queue.

`updatePostSchema` additionally allows `isSticky` and `isLocked`.

## Comments — `src/app/api/v1/forums/posts/{id}/comments`, `.../comments/{id}`

| Method + Path                             | Permission     | Request               | Success                                                                                           |
| ----------------------------------------- | -------------- | --------------------- | ------------------------------------------------------------------------------------------------- |
| GET `/api/v1/forums/posts/{id}/comments`  | `forum:read`   | —                     | 200, comment tree                                                                                 |
| POST `/api/v1/forums/posts/{id}/comments` | `forum:create` | `createCommentSchema` | 201                                                                                               |
| GET `/api/v1/forums/comments/{id}`        | `forum:read`   | —                     | 200                                                                                               |
| DELETE `/api/v1/forums/comments/{id}`     | `forum:delete` | —                     | 200 `{ id, deleted: true }` — soft delete; post comment count decremented in the same transaction |

`createCommentSchema`: `content` (1–20000, required), `parentId` (optional,
threading). Commenting on a locked post is rejected by the service.

## Moderation — `src/app/api/v1/forums/moderation/**`

| Method + Path                               | Permission       | Request              | Success                                                                               |
| ------------------------------------------- | ---------------- | -------------------- | ------------------------------------------------------------------------------------- |
| GET `/api/v1/forums/moderation/queue`       | `forum:moderate` | —                    | 200, `PENDING_REVIEW` posts ordered oldest-first, each with its pending `reportCount` |
| POST `/api/v1/forums/moderation/posts/{id}` | `forum:moderate` | `moderatePostSchema` | 200, moderated post                                                                   |

`moderatePostSchema`: `action` ∈ `approve` \| `reject` \| `hide` (required),
`reason` (≤1000). Approve → `PUBLISHED`; reject/hide → `HIDDEN`. The action
is recorded in the post's `metadata.moderation` (action, actor, timestamp).

## Reports — `src/app/api/v1/forums/reports/**`

| Method + Path                       | Permission       | Request                   | Success                                         |
| ----------------------------------- | ---------------- | ------------------------- | ----------------------------------------------- |
| GET `/api/v1/forums/reports`        | `forum:moderate` | `?status=` (ReportStatus) | 200, reports newest-first with target snapshots |
| POST `/api/v1/forums/reports`       | `forum:create`   | `createReportSchema`      | 201, report `PENDING`                           |
| PATCH `/api/v1/forums/reports/{id}` | `forum:moderate` | `resolveReportSchema`     | 200, resolved report                            |

`createReportSchema`: `targetType` ∈ `POST` \| `COMMENT` (required), exactly
one matching `postId` / `commentId` (schema-enforced), `reason` (1–1000,
required). 404 `not-found` when the target does not exist.

`resolveReportSchema`: `action` ∈ `RESOLVED` \| `DISMISSED` (required),
`deleteContent` (boolean — soft-deletes the reported post/comment).
409 `conflict` when the report is already resolved. Resolving does **not**
auto-touch the post's moderation state, and approving a post does not resolve
its reports — the two flows are independent by design.

## Errors

401/403 auth (plus the unpublished-post 403); 400 `business-logic-error`;
404 `not-found`; 409 `conflict`; 422 `validation-error`; 500
`internal-error`.
