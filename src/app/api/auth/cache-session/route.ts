import { NextRequest, NextResponse } from 'next/server';
import { cacheSession } from '@/lib/session-cache';
import { auth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Verify the user is authenticated before caching session
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { token, sessionData } = body;

    if (!token || !sessionData) {
      return NextResponse.json(
        { error: 'Missing token or sessionData' },
        { status: 400 }
      );
    }

    // Cache the session in Redis
    await cacheSession(token, sessionData);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error caching session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}