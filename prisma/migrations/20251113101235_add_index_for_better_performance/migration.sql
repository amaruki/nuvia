-- CreateIndex
CREATE INDEX "sessions_userId_expiresAt_idx" ON "public"."sessions"("userId", "expiresAt");

-- CreateIndex
CREATE INDEX "sessions_token_idx" ON "public"."sessions"("token");

-- CreateIndex
CREATE INDEX "sessions_expiresAt_idx" ON "public"."sessions"("expiresAt");

-- CreateIndex
CREATE INDEX "users_username_idx" ON "public"."users"("username");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "public"."users"("email");

-- CreateIndex
CREATE INDEX "users_deleted_at_idx" ON "public"."users"("deleted_at");
