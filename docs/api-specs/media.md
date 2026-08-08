# API Spec — Media

Uploads, listing, serving, and deletion (B4 media sub-decision). Media assets
have **no database table**: files land on local disk in `storage/uploads/`
with metadata in a JSON manifest (`storage/uploads/manifest.json`), because
migrations were frozen when this shipped. The whole module lives in
`src/lib/services/media-upload.service.ts`; swapping in S3/Cloudinary later
means replacing that one module. There is no media permission module — media
exists to serve content, so the `content:*` permissions govern it.

Route files: `src/app/api/v1/media/route.ts`,
`src/app/api/v1/media/[id]/route.ts`.

## Upload constraints (enforced by the service)

- Max size: **25 MB** per file (`MAX_UPLOAD_BYTES`); larger uploads get 413
  `payload-too-large`.
- Allowed content types (exact match): `application/pdf`, `application/zip`,
  `application/msword`,
  `application/vnd.openxmlformats-officedocument.wordprocessingml.document`,
  `application/vnd.ms-excel`,
  `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`,
  `application/vnd.ms-powerpoint`,
  `application/vnd.openxmlformats-officedocument.presentationml.presentation`,
  `text/plain`, `text/csv`. Anything else gets 400
  `invalid-request-format`.
- File names are sanitized and truncated to 120 chars; each stored record
  carries a sha256 `checksum`.

## GET /api/v1/media

Permission: `content:read`. No query parameters — returns every manifest
record. Success 200: array of `MediaUploadRecord` (`id`, `filename`,
`originalName`, `contentType`, `size`, `checksum`, `storagePath`, `url`,
`uploadedBy`, `uploadedAt`).

## POST /api/v1/media

Permission: `content:create`. Body: `multipart/form-data` with one or more
`file` fields (multiple files are accepted and saved sequentially).
Success 200 with the array of saved records (note: 200, not 201).

Errors: 400 `invalid-request-format` (not multipart, or no `file` field);
413 `payload-too-large`; 400 for disallowed/empty files.

## GET /api/v1/media/{id}

Permission: `content:read`. Serves the stored bytes directly — **not** the
JSON envelope. Response headers: the record's `Content-Type` (fallback
`application/octet-stream`), `Content-Length`,
`Content-Disposition: inline; filename="<originalName>"`,
`Cache-Control: private, max-age=3600`. Errors: 404 `not-found` (unknown id
or missing file on disk), 500 `internal-error`.

## DELETE /api/v1/media/{id}

Permission: `content:delete`. Removes the manifest entry first (the manifest
is the source of truth), then unlinks the file — a missing file on disk is
not fatal. Success 200 `{ deleted: true }`. Errors: 404 `not-found`, 500
`internal-error`.
