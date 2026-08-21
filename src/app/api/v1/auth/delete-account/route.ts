import { NextRequest } from "next/server";
import { APIError } from "better-auth/api";
import { auth } from "@/lib/auth";
import { resolveClientIp } from "@/lib/client-ip";
import { runUnlessLastSuperadmin } from "@/lib/rbac";
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

    const body = await request.json().catch(() => ({}));
    const password = typeof body?.password === "string" ? body.password : undefined;

    const deletion = await runUnlessLastSuperadmin(session.user.id, () =>
      auth.api.deleteUser({
        headers: request.headers,
        body: password ? { password } : {},
      }),
    );

    if (!deletion.allowed) {
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
      // Issue #3: trusted-hop resolution, not the raw XFF header.
      ip: resolveClientIp(request.headers),
      userAgent: request.headers.get("user-agent") || "unknown",
    });

    return problemResponse(
      problems.internalError("An unexpected error occurred while deleting account"),
    );
  }
}
