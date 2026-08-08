import { NextRequest } from "next/server";
import { count, desc, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db/client";
import { userLoginActivity } from "@/db/schema";
import { problemResponse, problems, successResponse } from "@/lib/http";
import { logger } from "@/lib/logger";

/**
 * GET /api/v1/auth/login-activities — the caller's own login history.
 *
 * Replaced the placeholder that always returned an empty list. Queries
 * the userLoginActivity table the schema always had, scoped strictly to
 * the caller's user id (there is no way to ask for someone else's),
 * newest first.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session || !session.user) {
      return problemResponse(problems.authenticationRequired());
    }

    const { searchParams } = new URL(request.url);
    const parsedPage = parseInt(searchParams.get("page") || "1", 10);
    const parsedLimit = parseInt(searchParams.get("limit") || "10", 10);
    const page = Number.isFinite(parsedPage) && parsedPage >= 1 ? parsedPage : 1;
    const limit = Number.isFinite(parsedLimit) ? Math.min(Math.max(parsedLimit, 1), 50) : 10;
    const offset = (page - 1) * limit;

    const whereClause = eq(userLoginActivity.userId, session.user.id);

    const [{ value: total }] = await db
      .select({ value: count() })
      .from(userLoginActivity)
      .where(whereClause);

    const activities = await db
      .select({
        id: userLoginActivity.id,
        ipAddress: userLoginActivity.ipAddress,
        userAgent: userLoginActivity.userAgent,
        deviceType: userLoginActivity.deviceType,
        location: userLoginActivity.location,
        loginAt: userLoginActivity.loginAt,
        successful: userLoginActivity.successful,
      })
      .from(userLoginActivity)
      .where(whereClause)
      .orderBy(desc(userLoginActivity.loginAt))
      .limit(limit)
      .offset(offset);

    return successResponse({
      activities,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error("Error retrieving login activities", error);
    return problemResponse(
      problems.internalError("An unexpected error occurred while retrieving login activities"),
    );
  }
}
