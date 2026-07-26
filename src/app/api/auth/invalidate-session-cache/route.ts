import { NextRequest, NextResponse } from "next/server";
import { invalidateSessionCache } from "@/lib/session-cache";
import { auth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    // Verify the user is authenticated before invalidating cache
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 400 });
    }

    // Invalidate the session cache in Redis
    await invalidateSessionCache(token);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error invalidating session cache:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
