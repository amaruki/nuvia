import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

// GET /api/v1/auth/active-devices - Get user's active devices
export async function GET(request: NextRequest) {
  try {
    // Get active devices using Better Auth API
    const sessions = await auth.api.listSessions({
      headers: request.headers
    });
    
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
    
    // Deactivate device using Better Auth API
    await auth.api.revokeSession({
      body: {
        token: token
      },
      headers: request.headers
    });

    // Create a standardized response
    const response = {
      success: true,
      message: 'Device deactivated successfully'
    };

    return NextResponse.json(response);
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