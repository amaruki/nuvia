ALTER TABLE "auth_logs" DROP CONSTRAINT "auth_logs_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "auth_logs" ADD CONSTRAINT "auth_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;