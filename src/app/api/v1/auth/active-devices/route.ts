import { NextRequest, NextResponse } from 'next/server';
import { getUserSessions, revokeSession } from '@/lib/utils/better-auth-utils';

// GET /api/v1/auth/active-devices - Get user's active devices
export async function GET(request: NextRequest) {
  try {
    // Get active devices
    const sessions = await getUserSessions();
    
    return NextResponse.json({
      success: true,
      data: {
        devices: sessions,
      },
      message: 'Active devices retrieved successfully',
      errors: undefined,
      meta: {
        timestamp: new Date(),
        version: 'v1',
      },
    });
  } catch (error) {
    // Return a generic error response
    return NextResponse.json(
      {
        success: false,
        message: 'An unexpected error occurred while retrieving active devices',
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

// DELETE /api/v1/auth/active-devices - Deactivate a device
export async function DELETE(request: NextRequest) {
  try {
    // Get device ID from query parameters
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    
    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: 'Device token is required',
          errors: {
            token: ['Device token is required'],
          },
          meta: {
            timestamp: new Date(),
            version: 'v1',
          },
        },
        { status: 400 }
      );
    }
    
    // Deactivate device
    const result = await revokeSession(token);
    
    return NextResponse.json(result);
  } catch (error) {
    // Return a generic error response
    return NextResponse.json(
      {
        success: false,
        message: 'An unexpected error occurred while deactivating device',
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