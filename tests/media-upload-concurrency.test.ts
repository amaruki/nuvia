import { describe, expect, test } from "bun:test";
import { readdir } from "node:fs/promises";
import {
  UPLOAD_DIR,
  deleteUpload,
  listUploads,
  saveUpload,
} from "@/lib/services/media-upload.service";

describe("media manifest concurrency", () => {
  test("concurrent uploads retain every successful record", async () => {
    const marker = `concurrent-${Date.now()}`;
    const uploads = await Promise.all(
      Array.from({ length: 20 }, (_, index) =>
        saveUpload(
          new File([new Uint8Array([137, 80, 78, 71, index])], `${marker}-${index}.png`, {
            type: "image/png",
          }),
          "media-concurrency-test",
        ),
      ),
    );

    try {
      const ids = new Set((await listUploads()).map((record) => record.id));
      expect(uploads.every((record) => ids.has(record.id))).toBe(true);

      const artifacts = await readdir(UPLOAD_DIR);
      expect(
        artifacts.some((name) => name.startsWith("manifest.json.") && name.endsWith(".tmp")),
      ).toBe(false);
    } finally {
      await Promise.all(uploads.map((record) => deleteUpload(record.id)));
    }
  });
});
