import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Deactivate other devices using Better Auth API
    await auth.api.revokeOtherSessions({
      headers: request.headers
    });

    // Create a standardized response
    const response = {
      success: true,
      message: 'Other devices deactivated successfully'
    };

    return NextResponse.json(response);
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