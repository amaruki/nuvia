import { randomUUID } from "node:crypto";
import { mkdir, open, readFile, rename, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";

export const UPLOAD_DIR = path.join(process.cwd(), "storage", "uploads");
const MANIFEST_PATH = path.join(UPLOAD_DIR, "manifest.json");
const MANIFEST_LOCK_PATH = `${MANIFEST_PATH}.lock`;
const LOCK_RETRY_MS = 10;
const LOCK_TIMEOUT_MS = 5_000;
const STALE_LOCK_MS = 30_000;

export interface MediaUploadRecord {
  id: string;
  filename: string;
  originalName: string;
  contentType: string;
  size: number;
  checksum: string;
  storagePath: string;
  url: string;
  uploadedBy: string;
  uploadedAt: string;
}

export async function ensureUploadDir(): Promise<void> {
  await mkdir(UPLOAD_DIR, { recursive: true });
}

export async function listManifestRecords(): Promise<MediaUploadRecord[]> {
  try {
    const raw = await readFile(MANIFEST_PATH, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as MediaUploadRecord[]) : [];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

async function writeManifest(records: MediaUploadRecord[]): Promise<void> {
  const tmpPath = `${MANIFEST_PATH}.${randomUUID()}.tmp`;
  try {
    await writeFile(tmpPath, JSON.stringify(records, null, 2), "utf8");
    await rename(tmpPath, MANIFEST_PATH);
  } catch (error) {
    await unlink(tmpPath).catch(() => undefined);
    throw error;
  }
}

async function withManifestLock<T>(operation: () => Promise<T>): Promise<T> {
  await ensureUploadDir();
  const deadline = Date.now() + LOCK_TIMEOUT_MS;

  while (true) {
    try {
      const lock = await open(MANIFEST_LOCK_PATH, "wx");
      try {
        return await operation();
      } finally {
        await lock.close();
        await unlink(MANIFEST_LOCK_PATH).catch(() => undefined);
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;

      const lockAge = await stat(MANIFEST_LOCK_PATH)
        .then((entry) => Date.now() - entry.mtimeMs)
        .catch(() => 0);
      if (lockAge > STALE_LOCK_MS) {
        await unlink(MANIFEST_LOCK_PATH).catch(() => undefined);
        continue;
      }
      if (Date.now() >= deadline) {
        throw new Error("Timed out while waiting for the media manifest lock");
      }
      await delay(LOCK_RETRY_MS);
    }
  }
}

export async function appendManifestRecord(record: MediaUploadRecord): Promise<void> {
  await withManifestLock(async () => {
    const records = await listManifestRecords();
    records.push(record);
    await writeManifest(records);
  });
}

export async function removeManifestRecord(id: string): Promise<MediaUploadRecord | null> {
  return withManifestLock(async () => {
    const records = await listManifestRecords();
    const record = records.find((entry) => entry.id === id);
    if (!record) return null;
    await writeManifest(records.filter((entry) => entry.id !== id));
    return record;
  });
}
