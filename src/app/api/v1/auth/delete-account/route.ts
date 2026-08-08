import { NextRequest } from "next/server";
import { APIError } from "better-auth/api";
import { auth } from "@/lib/auth";
import { isLastSuperadmin } from "@/lib/rbac";
import { logError } from "@/lib/errors";
import { problem, problemResponse, problems, successResponse } from "@/lib/http";

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session || !session.user) {
      return problemResponse(problems.authenticationRequired());
    }

    // Lockout guard: the only superadmin deleting their own account would
    // leave the deployment with no account able to grant the superadmin
    // role again — a permanent lockout of user management. A second
    // superadmin must exist first.
    if (await isLastSuperadmin(session.user.id)) {
      return problemResponse(
        problem(
          "last-superadmin",
          409,
          "Cannot delete the last super admin",
          "Promote another user to super admin before deleting this account, " +
            "or the system would be locked out of its own user management.",
        ),
      );
    }

    const body = await request.json().catch(() => ({}));
    const password = typeof body?.password === "string" ? body.password : undefined;

    // auth.api.deleteUser hard-deletes the user row (cascades to sessions,
    // accounts, active devices, login activity, password reset tokens, and
    // role-change history), revokes every session, and clears the session
    // cookie. Requires either a password or a session created recently
    // enough to count as "fresh" (better-auth's own freshAge check).
    await auth.api.deleteUser({
      headers: request.headers,
      body: password ? { password } : {},
    });

    return successResponse(null, { message: "Account deleted successfully" });
  } catch (error) {
    if (error instanceof APIError) {
      return problemResponse(
        problem("account-deletion-failed", error.statusCode ?? 400, error.message, error.message),
      );
    }

    logError(error as Error, {
      endpoint: "/api/v1/auth/delete-account",
      method: "DELETE",
      ip: request.headers.get("x-forwarded-for") || "unknown",
      userAgent: request.headers.get("user-agent") || "unknown",
    });

    return problemResponse(
      problems.internalError("An unexpected error occurred while deleting account"),
    );
  }
}
