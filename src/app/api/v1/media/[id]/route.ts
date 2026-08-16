import {
  MediaUploadError,
  deleteUpload,
  getUpload,
  isScriptCapableContentType,
  readUploadBytes,
} from "@/lib/services/media-upload.service";
import { logger } from "@/lib/logger";
import { problem, problemResponse, successResponse } from "@/lib/http";
import { requirePermission } from "@/lib/rbac";

/**
 * GET /api/v1/media/[id] — Serve the stored file bytes
 * DELETE /api/v1/media/[id] — Remove the file and its manifest entry
 * Requires: content:read / content:delete
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requirePermission("content:read");
    if (!auth.success) return problemResponse(auth.error!);

    const { id } = await params;
    const record = await getUpload(id);
    const bytes = await readUploadBytes(record);

    // Issue #6 defense-in-depth: script-capable types (SVG) must never be
    // rendered inline as a top-level document. Uploads are rejected at the
    // gate, but a legacy row in the manifest must still be served as an
    // attachment so embedded script cannot run in the app origin.
    const scriptCapable = isScriptCapableContentType(record.contentType);
    const disposition = scriptCapable ? "attachment" : "inline";

    return new Response(new Uint8Array(bytes), {
      status: 200,
      headers: {
        "Content-Type": scriptCapable
          ? "application/octet-stream"
          : record.contentType || "application/octet-stream",
        "Content-Length": String(bytes.byteLength),
        "Content-Disposition": `${disposition}; filename="${encodeURIComponent(record.originalName)}"`,
        "Cache-Control": "private, max-age=3600",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    if (error instanceof MediaUploadError) {
      return problemResponse(problem(error.slug, error.status, error.title, error.message));
    }
    logger.error("Media download error", error);
    return problemResponse(
      problem("internal-error", 500, "Internal server error", "An unexpected error occurred"),
    );
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requirePermission("content:delete");
    if (!auth.success) return problemResponse(auth.error!);

    const { id } = await params;
    await deleteUpload(id);
    return successResponse({ deleted: true });
  } catch (error) {
    if (error instanceof MediaUploadError) {
      return problemResponse(problem(error.slug, error.status, error.title, error.message));
    }
    logger.error("Media delete error", error);
    return problemResponse(
      problem("internal-error", 500, "Internal server error", "An unexpected error occurred"),
    );
  }
}
