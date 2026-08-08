/**
 * Chapter CRUD over the real `chapters` / `chapter_members` tables
 * (backlog D1, promotion queue). Split from src/lib/services/chapter.service.ts,
 * which stays as a re-export shim so `@/lib/services/chapter.service` keeps
 * resolving.
 *
 * - Rows map to the UI shape (src/types/chapter.types.ts) — the same
 *   contract the mock-era hook served. The metrics/events/finances fields
 *   have no backing tables yet and render as neutral defaults
 *   (statistics.ts), the same staging pattern the event service uses for
 *   not-yet-modeled fields.
 * - Every failure throws ChapterServiceError carrying an RFC 9457 problem;
 *   the /api/v1/chapters routes map it via handleChapterRoute.
 * - `name` is unique; duplicates surface as a 409 conflict.
 */

export { ChapterServiceError } from "./errors";
export { createChapterSchema, updateChapterSchema } from "./schemas";
export type { CreateChapterInput, UpdateChapterInput } from "./schemas";
export type { ChapterListFilters, Paginated } from "./types";
export { listChapters, getChapter } from "./queries";
export { createChapter, updateChapter, deleteChapter } from "./mutations";
