import { NextRequest } from "next/server";

import { logger } from "@/lib/logger";
import {
  categoryListQuerySchema,
  contentListQuerySchema,
  createAnnouncementSchema,
  createArticleSchema,
  createCategorySchema,
  createPublicationSchema,
  updateAnnouncementSchema,
  updateArticleSchema,
  updateCategorySchema,
  updatePublicationSchema,
} from "@/lib/validation/content.validation";
import { requirePermission } from "@/lib/rbac";
import { problem, problemResponse, successResponse, validationProblem } from "@/lib/http";
import {
  ContentApiError,
  type ContentCollection,
  createCategoryItem,
  createContentItem,
  deleteCategoryItem,
  deleteContentItem,
  getCategoryItem,
  getContentItem,
  listCategories,
  listContent,
  updateCategoryItem,
  updateContentItem,
} from "@/lib/services/content.service";

const CREATE_SCHEMAS = {
  articles: createArticleSchema,
  publications: createPublicationSchema,
  announcements: createAnnouncementSchema,
} as const;

const UPDATE_SCHEMAS = {
  articles: updateArticleSchema,
  publications: updatePublicationSchema,
  announcements: updateAnnouncementSchema,
} as const;

function toProblem(error: unknown) {
  if (error instanceof ContentApiError) {
    return problem(error.slug, error.status, error.title, error.message);
  }
  logger.error("Content API error", error);
  return problem("internal-error", 500, "Internal server error", "An unexpected error occurred");
}

function parseListParams(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const status = params.getAll("status");
  return {
    page: params.get("page") ?? undefined,
    limit: params.get("limit") ?? undefined,
    search: params.get("search") ?? undefined,
    status: status.length > 0 ? status : undefined,
    sortBy: params.get("sortBy") ?? undefined,
    sortOrder: params.get("sortOrder") ?? undefined,
  };
}

export async function handleContentList(collection: ContentCollection, request: NextRequest) {
  try {
    const auth = await requirePermission("content:read");
    if (!auth.success) return problemResponse(auth.error!);

    const parsed = contentListQuerySchema.safeParse(parseListParams(request));
    if (!parsed.success) return problemResponse(validationProblem(parsed.error));

    const result = await listContent(collection, parsed.data);
    return successResponse(result.items, {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
    });
  } catch (error) {
    return problemResponse(toProblem(error));
  }
}

export async function handleContentCreate(collection: ContentCollection, request: NextRequest) {
  try {
    const auth = await requirePermission("content:create");
    if (!auth.success) return problemResponse(auth.error!);

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return problemResponse(
        problem(
          "invalid-request-format",
          400,
          "Invalid request format",
          "Request body must be valid JSON",
        ),
      );
    }
    const parsed = CREATE_SCHEMAS[collection].safeParse(body);
    if (!parsed.success) return problemResponse(validationProblem(parsed.error));

    const item = await createContentItem(collection, parsed.data, auth.user!.id);
    return successResponse(item);
  } catch (error) {
    return problemResponse(toProblem(error));
  }
}

export async function handleContentRead(collection: ContentCollection, id: string) {
  try {
    const auth = await requirePermission("content:read");
    if (!auth.success) return problemResponse(auth.error!);

    const item = await getContentItem(collection, id);
    return successResponse(item);
  } catch (error) {
    return problemResponse(toProblem(error));
  }
}

export async function handleContentUpdate(
  collection: ContentCollection,
  id: string,
  request: NextRequest,
) {
  try {
    const auth = await requirePermission("content:update");
    if (!auth.success) return problemResponse(auth.error!);

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return problemResponse(
        problem(
          "invalid-request-format",
          400,
          "Invalid request format",
          "Request body must be valid JSON",
        ),
      );
    }
    const parsed = UPDATE_SCHEMAS[collection].safeParse(body);
    if (!parsed.success) return problemResponse(validationProblem(parsed.error));

    const item = await updateContentItem(collection, id, parsed.data, auth.user!.id);
    return successResponse(item);
  } catch (error) {
    return problemResponse(toProblem(error));
  }
}

export async function handleContentDelete(collection: ContentCollection, id: string) {
  try {
    const auth = await requirePermission("content:delete");
    if (!auth.success) return problemResponse(auth.error!);

    await deleteContentItem(collection, id);
    return successResponse({ deleted: true });
  } catch (error) {
    return problemResponse(toProblem(error));
  }
}

// ── Categories ──────────────────────────────────────────────────────────────

export async function handleCategoryList(request: NextRequest) {
  try {
    const auth = await requirePermission("content:read");
    if (!auth.success) return problemResponse(auth.error!);

    const params = request.nextUrl.searchParams;
    const parsed = categoryListQuerySchema.safeParse({
      page: params.get("page") ?? undefined,
      limit: params.get("limit") ?? undefined,
      search: params.get("search") ?? undefined,
    });
    if (!parsed.success) return problemResponse(validationProblem(parsed.error));

    const result = await listCategories(parsed.data);
    return successResponse(result.items, {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
    });
  } catch (error) {
    return problemResponse(toProblem(error));
  }
}

export async function handleCategoryCreate(request: NextRequest) {
  try {
    const auth = await requirePermission("content:create");
    if (!auth.success) return problemResponse(auth.error!);

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return problemResponse(
        problem(
          "invalid-request-format",
          400,
          "Invalid request format",
          "Request body must be valid JSON",
        ),
      );
    }
    const parsed = createCategorySchema.safeParse(body);
    if (!parsed.success) return problemResponse(validationProblem(parsed.error));

    const category = await createCategoryItem(parsed.data, auth.user!.id);
    return successResponse(category);
  } catch (error) {
    return problemResponse(toProblem(error));
  }
}

export async function handleCategoryRead(id: string) {
  try {
    const auth = await requirePermission("content:read");
    if (!auth.success) return problemResponse(auth.error!);

    const category = await getCategoryItem(id);
    return successResponse(category);
  } catch (error) {
    return problemResponse(toProblem(error));
  }
}

export async function handleCategoryUpdate(id: string, request: NextRequest) {
  try {
    const auth = await requirePermission("content:update");
    if (!auth.success) return problemResponse(auth.error!);

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return problemResponse(
        problem(
          "invalid-request-format",
          400,
          "Invalid request format",
          "Request body must be valid JSON",
        ),
      );
    }
    const parsed = updateCategorySchema.safeParse(body);
    if (!parsed.success) return problemResponse(validationProblem(parsed.error));

    const category = await updateCategoryItem(id, parsed.data, auth.user!.id);
    return successResponse(category);
  } catch (error) {
    return problemResponse(toProblem(error));
  }
}

export async function handleCategoryDelete(id: string) {
  try {
    const auth = await requirePermission("content:delete");
    if (!auth.success) return problemResponse(auth.error!);

    await deleteCategoryItem(id);
    return successResponse({ deleted: true });
  } catch (error) {
    return problemResponse(toProblem(error));
  }
}
