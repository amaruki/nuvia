# API Spec — Organization

The organization singleton (ADR-0007) — one row, read and updated through a
two-endpoint surface. Route: `src/app/api/v1/organization/route.ts`.
Schema: `src/lib/validation/organization.validation.ts`. Service:
`src/lib/services/organization.service.ts` (upserts the singleton and stamps
`updatedBy`).

## GET /api/v1/organization

Permission: `organization:read`. No parameters. Success 200 with the
organization row.

## PATCH /api/v1/organization

Permission: `organization:update`. Body: `organizationUpdateSchema`. The
settings form always submits every field, so **all fields are required** —
there is no partial-PATCH schema today. Success 200 with the updated row.

| Field          | Rule                          | Notes                                                              |
| -------------- | ----------------------------- | ------------------------------------------------------------------ |
| `name`         | string 1–200, trimmed         | required                                                           |
| `legalName`    | string ≤300                   | blank → `null`                                                     |
| `logo`         | string ≤500, http(s) URL      | blank → `null`                                                     |
| `website`      | string ≤500, http(s) URL      | blank → `null`                                                     |
| `supportEmail` | string ≤320, valid email      | blank → `null`                                                     |
| `locale`       | string 2–35, valid BCP 47 tag | required                                                           |
| `currency`     | 3-letter ISO 4217 code        | uppercased; validated against `Intl.supportedValuesOf("currency")` |
| `timezone`     | string 1–64, IANA name        | validated against `Intl.supportedValuesOf("timeZone")`             |

Blank strings on the nullable columns are normalized to real `NULL`s by the
schema's transforms.

## Errors

400 `invalid-json` (non-JSON body); 401/403 auth; 422 `validation-error`
with `errors[]`; 500 `internal-error`.
