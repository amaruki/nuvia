# API Spec — Content

Articles, publications, announcements, and categories (backlog B4). All four
collections are stored in the single `content` table discriminated by `type`
(the `PUBLICATION` enum value was added in migration
`drizzle/0003_quick_katie_power.sql`), and every route delegates to the
shared handlers in `src/app/api/v1/content/shared.ts`. UI-level fields
round-trip through `content.metadata.ui`; the per-collection `type` field is
stored at `metadata.ui.type`.

Route files: `src/app/api/v1/content/{articles,publications,announcements,categories}/**`.
Schemas: `src/lib/validation/content.validation.ts`.

## Permission matrix (identical for all four collections)

| Operation           | Permission       | Status on success              |
| ------------------- | ---------------- | ------------------------------ |
| GET list / GET item | `content:read`   | 200                            |
| POST create         | `content:create` | 200                            |
| PATCH update        | `content:update` | 200                            |
| DELETE              | `content:delete` | 200, `data: { deleted: true }` |

Note: content creates answer 200 (not 201) — that is what
`handleContentCreate` returns today.

## Endpoints

| Collection    | List / create                            | Item                                                  |
| ------------- | ---------------------------------------- | ----------------------------------------------------- |
| Articles      | `GET/POST /api/v1/content/articles`      | `GET/PATCH/DELETE /api/v1/content/articles/{id}`      |
| Publications  | `GET/POST /api/v1/content/publications`  | `GET/PATCH/DELETE /api/v1/content/publications/{id}`  |
| Announcements | `GET/POST /api/v1/content/announcements` | `GET/PATCH/DELETE /api/v1/content/announcements/{id}` |
| Categories    | `GET/POST /api/v1/content/categories`    | `GET/PATCH/DELETE /api/v1/content/categories/{id}`    |

## List queries

Items (`contentListQuerySchema`): `page` (≥1, default 1), `limit` (1–100,
default 20), `search` (≤200), `status[]` (`draft`, `review`, `published`,
`archived`, `scheduled`), `sortBy` (`title`, `createdAt`, `updatedAt`,
`publishedAt`; default `createdAt`), `sortOrder` (`asc`/`desc`, default
`desc`). Success 200: `data` is the item array; `meta` carries `page`,
`limit`, `total`, `totalPages`.

Categories (`categoryListQuerySchema`): `page` (default 1), `limit`
(1–100, default 100), `search`.

## Shared item fields (`contentBaseSchema`)

Required: `title` (1–300), `content` (min 1). Optional: `slug` (≤300),
`excerpt` (≤2000), `status` (enum above), `visibility` (`public`,
`members_only`, `premium_only`, `chapter_only`, `committee_only`), `authorId`,
`coAuthorIds` (≤20), `reviewerId`, `tagIds` (≤50), `featuredImage` (≤2000),
`gallery` (≤20 URLs), `attachments`, `publishedAt` / `scheduledFor` /
`reviewedAt` (string \| number \| Date), `seo` (partial `{ title ≤200,
description ≤500, keywords ≤30, ogImage ≤2000, canonicalUrl ≤2000 }`),
`allowedRoles` / `allowedChapters` / `allowedCommittees` (≤20 each),
`commentsEnabled`, `sharingEnabled`, `downloadEnabled`, `isFeatured`,
`isPinned`, `priority` (int −100–100), `version` (int ≥1), `language` (2–5).

PATCH accepts the partial of the collection's create schema.

## Collection extensions

- **Articles** (`createArticleSchema`): `type` ∈ `article`, `tutorial`,
  `guide`, `news`, `documentation`, `case_study`, `resource`; `category`
  (≤100), `difficulty` (≤50), `format` (≤50).
- **Publications** (`createPublicationSchema`): `type` ∈ `whitepaper`,
  `report`, `case_study`, `research`, `manual`, `policy`, `guide`,
  `resource`; same `category`/`difficulty`/`format` fields.
- **Announcements** (`createAnnouncementSchema`): `type` ∈ `system`, `event`,
  `update`, `maintenance`, `policy`, `urgent`, `banner`; `category` (≤100),
  `targetAudience` (≤100), `targetChapters` / `targetCommittees` (≤20 each),
  `expiresAt` (date input), `isUrgent`, `requiresAcknowledgment`,
  `acknowledgmentCount` (int ≥0), `sendEmailNotification`,
  `sendPushNotification`, `displayOnHomepage`, `displayInDashboard`.
- **Categories** (`createCategorySchema`, separate schema): required `name`
  (1–100); optional `slug` (≤150), `description` (≤1000), `type` (≤50),
  `scope` (≤50), `status` (`active`/`inactive`/`archived`), `color` (≤50),
  `icon` (≤100), `emoji` (≤8), `order` (int ≥0), `parentId` (≤100),
  `allowedRoles` / `allowedChapters` / `allowedCommittees` (≤20 each).

## Errors

401/403 auth; 404 `not-found` for unknown ids; 409 `conflict` for slug
collisions (`ContentApiError.conflict` in `src/lib/services/content/errors.ts`);
400 `invalid-request-format` for non-JSON bodies; 422 `validation-error` with
`errors[]` on schema rejection; 500 `internal-error`.
