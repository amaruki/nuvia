-- Issue #14: the indexes named *_unique were plain CREATE INDEX, so the
-- DB-level duplicate guard did not exist. Two concurrent inserts for the
-- same (user, event) / (job, user) both passed the app-level check.
--> statement-breakpoint
-- 1) Dedupe existing rows: keep the newest per key (the service treats
--    re-registration as an UPDATE of the newest row).
DELETE FROM "event_registrations" a
USING "event_registrations" b
WHERE a."user_id" = b."user_id"
  AND a."event_id" = b."event_id"
  AND (a."created_at", a."id") < (b."created_at", b."id");
--> statement-breakpoint
DELETE FROM "job_applications" a
USING "job_applications" b
WHERE a."job_id" = b."job_id"
  AND a."user_id" = b."user_id"
  AND (a."applied_at", a."id") < (b."applied_at", b."id");
--> statement-breakpoint
-- 2) Replace the plain indexes with REAL partial unique indexes. The
--    status <> 'CANCELED' predicate matches the service semantics: a
--    canceled registration is replaced in place on re-registration
--    (UPDATE, not INSERT), so only live rows need the guard. The unique
--    violation also rolls back the same-transaction counter bump, so the
--    seat counts can never inflate again.
DROP INDEX "event_registrations_user_event_unique";
--> statement-breakpoint
CREATE UNIQUE INDEX "event_registrations_user_event_unique"
  ON "event_registrations" ("user_id", "event_id")
  WHERE "status" <> 'CANCELED';
--> statement-breakpoint
DROP INDEX "job_applications_job_user_unique";
--> statement-breakpoint
CREATE UNIQUE INDEX "job_applications_job_user_unique"
  ON "job_applications" ("job_id", "user_id")
  WHERE "status" <> 'WITHDRAWN';
--> statement-breakpoint
-- 3) Recompute seat counters from the surviving rows so any inflation
--    left by past duplicates is corrected too (mirrors mutations-cancel:
--    seat holders = CONFIRMED + PENDING + ATTENDED + NO_SHOW).
UPDATE "events" e
SET
  "registered_count" = (
    SELECT count(*) FROM "event_registrations" r
    WHERE r."event_id" = e."id"
      AND r."status" IN ('CONFIRMED', 'PENDING', 'ATTENDED', 'NO_SHOW')
  ),
  "waitlist_count" = (
    SELECT count(*) FROM "event_registrations" r
    WHERE r."event_id" = e."id" AND r."status" = 'WAITLISTED'
  );
--> statement-breakpoint
UPDATE "job_postings" p
SET "application_count" = (
  SELECT count(*) FROM "job_applications" a
  WHERE a."job_id" = p."id" AND a."status" <> 'WITHDRAWN'
);
