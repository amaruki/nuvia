/**
 * Local-disk storage backend for media uploads (B4 media sub-decision).
 *
 * Decision: uploads land in `storage/uploads/` on the app server, with
 * metadata kept in a JSON manifest (`storage/uploads/manifest.json`)
 * next to the files. There is no media table in the database schema and
 * migrations are frozen at 0003, so the manifest is the most durable
 * persistence the current schema allows — it survives restarts, needs no
 * storage dependency, and swapping in S3/Cloudinary later means replacing
 * this single module (the `MediaUploadRecord.url` indirection already
 * points clients at the API route, not at a disk path).
 */
import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

export const UPLOAD_DIR = path.join(process.cwd(), "storage", "uploads");
const MANIFEST_PATH = path.join(UPLOAD_DIR, "manifest.json");
const MAX_FILENAME_LENGTH = 120;

/** 25 MB per file — generous for documents, small enough for local disk. */
export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

const EXACT_CONTENT_TYPES = new Set([
  "application/pdf",
  "application/zip",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "text/csv",
]);

export interface MediaUploadRecord {
  id: string;
  /** Storage-safe file name inside UPLOAD_DIR. */
  filename: string;
  /** Name the client sent. */
  originalName: string;
  contentType: string;
  size: number;
  /** sha256 of the stored bytes. */
  checksum: string;
  /** Absolute path on disk. */
  storagePath: string;
  /** Route clients use to fetch the bytes. */
  url: string;
  uploadedBy: string;
  uploadedAt: string;
}

export class MediaUploadError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly slug: string,
    public readonly title: string,
  ) {
    super(message);
    this.name = "MediaUploadError";
  }

  static notFound(what = "Media upload"): MediaUploadError {
    return new MediaUploadError(`${what} not found`, 404, "not-found", "Not found");
  }

  static invalidFile(detail: string): MediaUploadError {
    return new MediaUploadError(detail, 400, "invalid-request-format", "Invalid file");
  }

  static tooLarge(name: string): MediaUploadError {
    return new MediaUploadError(
      `"${name}" exceeds the ${MAX_UPLOAD_BYTES / (1024 * 1024)} MB upload limit`,
      413,
      "payload-too-large",
      "File too large",
    );
  }
}

function isAllowedContentType(contentType: string): boolean {
  const type = contentType.toLowerCase();
  return (
    type.startsWith("image/") ||
    type.startsWith("video/") ||
    type.startsWith("audio/") ||
    EXACT_CONTENT_TYPES.has(type)
  );
}

/** Reduce a client-supplied file name to a safe, non-empty basename. */
export function sanitizeFilename(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? "";
  const cleaned = base
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^\.+/, "")
    .slice(0, MAX_FILENAME_LENGTH)
    .replace(/\.+$/, "");
  return cleaned || "upload";
}

async function ensureUploadDir(): Promise<void> {
  await mkdir(UPLOAD_DIR, { recursive: true });
}

async function readManifest(): Promise<MediaUploadRecord[]> {
  try {
    const raw = await readFile(MANIFEST_PATH, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as MediaUploadRecord[]) : [];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

/** Atomic-ish manifest write: temp file + rename so readers never see JSON. */
async function writeManifest(records: MediaUploadRecord[]): Promise<void> {
  await ensureUploadDir();
  const tmpPath = `${MANIFEST_PATH}.tmp`;
  await writeFile(tmpPath, JSON.stringify(records, null, 2), "utf8");
  await rename(tmpPath, MANIFEST_PATH);
}

/**
 * Persist one uploaded file to local disk and record it in the manifest.
 */
export async function saveUpload(file: File, uploadedBy: string): Promise<MediaUploadRecord> {
  if (!file || typeof file.size !== "number" || file.size === 0) {
    throw MediaUploadError.invalidFile("Uploaded file is empty");
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw MediaUploadError.tooLarge(file.name || "upload");
  }
  if (!isAllowedContentType(file.type)) {
    throw MediaUploadError.invalidFile(`Content type "${file.type || "unknown"}" is not allowed`);
  }

  await ensureUploadDir();

  const id = randomUUID();
  const safeName = sanitizeFilename(file.name || "");
  const filename = `${id}-${safeName}`;
  const storagePath = path.join(UPLOAD_DIR, filename);
  const bytes = Buffer.from(await file.arrayBuffer());

  await writeFile(storagePath, bytes);

  const record: MediaUploadRecord = {
    id,
    filename,
    originalName: file.name || safeName,
    contentType: file.type,
    size: file.size,
    checksum: createHash("sha256").update(bytes).digest("hex"),
    storagePath,
    url: `/api/v1/media/${id}`,
    uploadedBy,
    uploadedAt: new Date().toISOString(),
  };

  const records = await readManifest();
  records.push(record);
  await writeManifest(records);
  return record;
}

export async function listUploads(): Promise<MediaUploadRecord[]> {
  const records = await readManifest();
  return records.sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
}

/** Query params accepted by the paginated media listing. */
export interface MediaListQuery {
  page?: number;
  limit?: number;
  search?: string;
}

/** Paginated slice of manifest uploads for server-driven tables. */
export interface PagedMediaList {
  items: MediaUploadRecord[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Server-paginated listing for the admin media table. Keeps manifest
 * ordering (newest first) and matches `search` case-insensitively against
 * file name, original name, content type, and uploader.
 */
export async function listUploadsPaged(query: MediaListQuery): Promise<PagedMediaList> {
  const all = await listUploads();
  const needle = query.search?.trim().toLowerCase();
  const filtered = needle
    ? all.filter((upload) =>
        [upload.filename, upload.originalName, upload.contentType, upload.uploadedBy]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(needle),
      )
    : all;

  const limit = Math.min(Math.max(1, query.limit ?? 20), 100);
  const page = Math.max(1, query.page ?? 1);
  const start = (page - 1) * limit;

  return {
    items: filtered.slice(start, start + limit),
    page,
    limit,
    total: filtered.length,
    totalPages: Math.max(1, Math.ceil(filtered.length / limit)),
  };
}

export async function getUpload(id: string): Promise<MediaUploadRecord> {
  const records = await readManifest();
  const record = records.find((entry) => entry.id === id);
  if (!record) throw MediaUploadError.notFound();
  return record;
}

export async function readUploadBytes(record: MediaUploadRecord): Promise<Buffer> {
  try {
    return await readFile(record.storagePath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      throw MediaUploadError.notFound("File on disk");
    }
    throw error;
  }
}

export async function deleteUpload(id: string): Promise<MediaUploadRecord> {
  const records = await readManifest();
  const record = records.find((entry) => entry.id === id);
  if (!record) throw MediaUploadError.notFound();

  await writeManifest(records.filter((entry) => entry.id !== id));
  try {
    await unlink(record.storagePath);
  } catch (error) {
    // The manifest is the source of truth; a missing file is not fatal.
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
  return record;
}
