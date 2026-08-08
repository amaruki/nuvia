# API Spec — Events

Event CRUD and registrations (backlog B2/B3). All handlers wrap service work
in `handleEventRoute()` (`src/app/api/v1/events/_lib.ts`), which maps
`EventWriteError` / `RegistrationServiceError` to their embedded
`problemDetails` and everything else to 500 `internal-error`.

Route files: `src/app/api/v1/events/**`. Schemas: `eventFields` in
`src/lib/services/event-write.service.ts`, `listEventsQuerySchema` in
`src/lib/services/event-read.service.ts`, registration schemas in
`src/lib/services/registration.service.ts`. Enums from
`src/db/schema/enums.ts`.

## GET /api/v1/events

Permission: `events:read`. Query (`listEventsQuerySchema`):

| Param                   | Type           | Default          | Notes                                                                                                                                                |
| ----------------------- | -------------- | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `page` / `limit`        | int ≥1 / 1–100 | 1 / 20           |                                                                                                                                                      |
| `search`                | string         | —                | title/description/location                                                                                                                           |
| `categoryId`            | string         | —                |                                                                                                                                                      |
| `status`                | enum[]         | —                | repeatable or comma-separated; `DRAFT`, `PUBLISHED`, `REGISTRATION_OPEN`, `REGISTRATION_CLOSED`, `IN_PROGRESS`, `COMPLETED`, `CANCELED`, `POSTPONED` |
| `type`                  | enum[]         | —                | `CONFERENCE`, `MEETUP`, `WORKSHOP`, `WEBINAR`, `NETWORKING`, `SOCIAL`, `TRAINING`, `PANEL_DISCUSSION`, `KEYNOTE`, `OTHER`                            |
| `format`                | enum[]         | —                | `IN_PERSON`, `VIRTUAL`, `HYBRID`, `RECORDED`, `LIVE_STREAM`                                                                                          |
| `visibility`            | enum[]         | —                | `PUBLIC`, `MEMBERS_ONLY`, `PREMIUM_MEMBERS`, `SPECIFIC_ROLES`, `PRIVATE`, `INVITE_ONLY`                                                              |
| `startDate` / `endDate` | date           | —                | ISO bounds on start time                                                                                                                             |
| `createdBy`             | string         | —                |                                                                                                                                                      |
| `isVirtual`             | boolean        | —                |                                                                                                                                                      |
| `tags`                  | string[]       | —                | repeatable or comma-separated                                                                                                                        |
| `sortBy` / `sortOrder`  | string         | createdAt / desc |                                                                                                                                                      |

Success 200: `data.events[]` with pagination in `meta`.

## POST /api/v1/events

Permission: `events:create`. Body (`createEventSchema`):

| Field                                   | Type                                       | Required | Notes                               |
| --------------------------------------- | ------------------------------------------ | -------- | ----------------------------------- |
| `title`                                 | string 3–200                               | yes      |                                     |
| `slug`                                  | string 3–200, `^[a-z0-9]+(?:-[a-z0-9]+)*$` | no       |                                     |
| `description`                           | string 10–20000                            | yes      |                                     |
| `shortDescription`                      | string ≤500                                | no       |                                     |
| `category`                              | string                                     | yes      | category id **or** unique name      |
| `type`                                  | EventType enum                             | yes      |                                     |
| `format`                                | EventFormat enum                           | yes      |                                     |
| `status`                                | EventStatus enum                           | no       | default `DRAFT`                     |
| `visibility`                            | EventVisibility enum                       | no       | default `PUBLIC`                    |
| `capacity`                              | positive int \| null                       | no       |                                     |
| `isVirtual`                             | boolean                                    | no       | default false                       |
| `isFree`                                | boolean                                    | no       | default true                        |
| `price`                                 | number 0–99,999,999.99                     | no       |                                     |
| `currency`                              | 3-letter ISO                               | no       | default `USD`, uppercased           |
| `location`                              | string ≤500                                | no       |                                     |
| `virtualUrl`                            | URL                                        | no       |                                     |
| `timezone`                              | string                                     | no       | default `UTC`                       |
| `startTime` / `endTime`                 | date (coerced)                             | yes      | `endTime` must be after `startTime` |
| `registrationStart` / `registrationEnd` | date (coerced)                             | no       | end must be after start             |
| `allowWaitlist`                         | boolean                                    | no       | default true                        |
| `requiresApproval`                      | boolean                                    | no       | default false                       |
| `tags`                                  | string[] ≤20                               | no       | default []                          |
| `metadata`                              | record                                     | no       |                                     |

Success 201 with the event DTO. Errors: 422 validation (also 422 for a
non-JSON body), plus service problems (404 unknown category, ...).

## GET / PATCH / DELETE /api/v1/events/{id}

Permissions: `events:read` / `events:update` / `events:delete`.

- GET: 200 with the event DTO; 404 `not-found`.
- PATCH: body is `updateEventSchema` (partial of the create fields); 200 with
  the updated DTO; 404 unknown id.
- DELETE: hard delete; 200 `{ id, deleted: true }`; 404 unknown id.

Route: `src/app/api/v1/events/[id]/route.ts`.

## GET /api/v1/events/{id}/registrations

Permission: `events:manage` (admin view). Query
(`listRegistrationsQuerySchema`): `page`/`limit` (defaults 1/20, limit ≤100),
`status[]` (`PENDING`, `CONFIRMED`, `WAITLISTED`, `CANCELED`, `ATTENDED`,
`NO_SHOW`), `search` (1–200). Success 200 with registrations + pagination.
Route: `src/app/api/v1/events/[id]/registrations/route.ts`.

## POST /api/v1/events/{id}/registrations

Permission: `events:read` — self-registration for the authenticated user.
Body (`createRegistrationSchema`): optional `notes` (≤2000).

Outcome status is computed by the service:

- `PENDING` when the event is paid (`isFree` false),
- `CONFIRMED` when capacity allows (or capacity is null),
- `WAITLISTED` when full and `allowWaitlist` is true,
- 400 `business-logic-error` "Event is at full capacity and the waitlist is
  disabled" otherwise.

Success 201: registration DTO, event DTO in `meta`.
Route: `src/app/api/v1/events/[id]/registrations/route.ts`.

## POST /api/v1/events/{id}/registrations/{registrationId}/check-in

Permission: `events:manage`. No body — path params only. Marks a CONFIRMED
registration as ATTENDED. Success 200: registration DTO, event DTO in `meta`.
404 when the registration/event pair does not match.
Route: `.../registrations/[registrationId]/check-in/route.ts`.

## POST /api/v1/events/{id}/registrations/{registrationId}/cancel

Permission: `events:read` plus a self-service check in the service layer —
only the registrant or an event manager may cancel; anyone else gets 403
`insufficient-permission`. No body. Frees capacity / promotes the waitlist in
the same transaction. Success 200.
Route: `.../registrations/[registrationId]/cancel/route.ts`.

## Error summary

401/403 auth; 404 `not-found`; 400 `business-logic-error` (capacity/waitlist
rules); 422 `validation-error` (incl. non-JSON body); 500 `internal-error`.
