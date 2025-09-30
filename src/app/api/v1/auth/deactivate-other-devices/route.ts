import { NextRequest, NextResponse } from 'next/server';
import { revokeOtherSessions } from '@/lib/utils/better-auth-utils';

export async function POST(request: NextRequest) {
  try {
    // Deactivate other devices
    const result = await revokeOtherSessions();
    
    return NextResponse.json(result);
  } catch (error) {
    // Return a generic error response
    return NextResponse.json(
      {
        success: false,
        message: 'An unexpected error occurred while deactivating other devices',
        errors: {
          server: ['Please try again later'],
        },
        meta: {
          timestamp: new Date(),
          version: 'v1',
        },
      },
      { status: 500 }
    );
  }
}