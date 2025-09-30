import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../auth';
import { AuthenticationError, AuthorizationError, logError } from '../errors';

/**
 * Middleware to authenticate requests
 * @param request - The incoming request
 * @returns NextResponse or the authenticated user ID
 */
export async function authenticateRequest(request: NextRequest): Promise<string> {
  try {
    // Use better-auth to validate the session
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    
    if (!session || !session.user) {
      throw new AuthenticationError('Authentication required');
    }
    
    // Return the user ID
    return session.user.id;
  } catch (error) {
    if (error instanceof AuthenticationError) {
      throw error;
    }
    
    logError(error as Error, {
      endpoint: request.nextUrl.pathname,
      method: request.method,
      ip: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
    });
    
    throw new AuthenticationError('Authentication failed');
  }
}

/**
 * Middleware to check if a user is authorized to access a resource
 * @param request - The incoming request
 * @param resourceOwnerId - The ID of the resource owner
 * @throws AuthorizationError if the user is not authorized
 */
export async function authorizeResourceAccess(
  request: NextRequest,
  resourceOwnerId: string
): Promise<void> {
  try {
    // Get the authenticated user ID
    const userId = await authenticateRequest(request);
    
    // Check if the user is the resource owner
    if (userId !== resourceOwnerId) {
      throw new AuthorizationError('You are not authorized to access this resource');
    }
  } catch (error) {
    if (error instanceof AuthorizationError || error instanceof AuthenticationError) {
      throw error;
    }
    
    logError(error as Error, {
      endpoint: request.nextUrl.pathname,
      method: request.method,
      ip: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
    });
    
    throw new AuthorizationError('Authorization check failed');
  }
}

/**
 * Higher-order function to create an authenticated route handler
 * @param handler - The route handler to wrap
 * @returns Wrapped route handler with authentication
 */
export function withAuth<T extends any[], R extends NextResponse>(
  handler: (request: NextRequest, userId: string, ...args: T) => Promise<R>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    try {
      const userId = await authenticateRequest(request);
      return await handler(request, userId, ...args);
    } catch (error) {
      if (error instanceof AuthenticationError) {
        return NextResponse.json(
          {
            success: false,
            message: error.message,
            errors: {
              authentication: [error.message],
            },
            meta: {
              timestamp: new Date(),
              version: 'v1',
            },
          },
          { status: 401 }
        );
      }
      
      if (error instanceof AuthorizationError) {
        return NextResponse.json(
          {
            success: false,
            message: error.message,
            errors: {
              authorization: [error.message],
            },
            meta: {
              timestamp: new Date(),
              version: 'v1',
            },
          },
          { status: 403 }
        );
      }
      
      logError(error as Error, {
        endpoint: request.nextUrl.pathname,
        method: request.method,
        ip: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      });
      
      return NextResponse.json(
        {
          success: false,
          message: 'An unexpected error occurred',
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
  };
}

/**
 * Higher-order function to create a route handler with resource ownership check
 * @param getResourceOwnerId - Function to get the resource owner ID from request parameters
 * @param handler - The route handler to wrap
 * @returns Wrapped route handler with authentication and authorization
 */
export function withResourceAuth<T extends any[], R extends NextResponse>(
  getResourceOwnerId: (request: NextRequest, ...args: T) => Promise<string> | string,
  handler: (request: NextRequest, userId: string, ...args: T) => Promise<R>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    try {
      const userId = await authenticateRequest(request);
      const resourceOwnerId = await getResourceOwnerId(request, ...args);
      
      // Check if the user is the resource owner
      if (userId !== resourceOwnerId) {
        throw new AuthorizationError('You are not authorized to access this resource');
      }
      
      return await handler(request, userId, ...args);
    } catch (error) {
      if (error instanceof AuthenticationError) {
        return NextResponse.json(
          {
            success: false,
            message: error.message,
            errors: {
              authentication: [error.message],
            },
            meta: {
              timestamp: new Date(),
              version: 'v1',
            },
          },
          { status: 401 }
        );
      }
      
      if (error instanceof AuthorizationError) {
        return NextResponse.json(
          {
            success: false,
            message: error.message,
            errors: {
              authorization: [error.message],
            },
            meta: {
              timestamp: new Date(),
              version: 'v1',
            },
          },
          { status: 403 }
        );
      }
      
      logError(error as Error, {
        endpoint: request.nextUrl.pathname,
        method: request.method,
        ip: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      });
      
      return NextResponse.json(
        {
          success: false,
          message: 'An unexpected error occurred',
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
  };
}

/**
 * Middleware to check if a user has a specific role
 * @param request - The incoming request
 * @param requiredRole - The role required to access the resource
 * @throws AuthorizationError if the user does not have the required role
 */
export async function authorizeByRole(
  request: NextRequest,
  requiredRole: string
): Promise<void> {
  try {
    // Get the authenticated user ID
    const userId = await authenticateRequest(request);
    
    // In a real implementation, you would fetch the user's role from the database
    // For now, we'll just check if the user has the required role in the headers
    const userRole = request.headers.get('x-user-role');
    
    if (userRole !== requiredRole) {
      throw new AuthorizationError('You do not have the required permissions to access this resource');
    }
  } catch (error) {
    if (error instanceof AuthorizationError || error instanceof AuthenticationError) {
      throw error;
    }
    
    logError(error as Error, {
      endpoint: request.nextUrl.pathname,
      method: request.method,
      ip: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
    });
    
    throw new AuthorizationError('Authorization check failed');
  }
}

/**
 * Higher-order function to create a route handler with role-based access control
 * @param requiredRole - The role required to access the resource
 * @param handler - The route handler to wrap
 * @returns Wrapped route handler with authentication and role-based authorization
 */
export function withRoleAuth<T extends any[], R extends NextResponse>(
  requiredRole: string,
  handler: (request: NextRequest, userId: string, ...args: T) => Promise<R>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    try {
      const userId = await authenticateRequest(request);
      
      // In a real implementation, you would fetch the user's role from the database
      // For now, we'll just check if the user has the required role in the headers
      const userRole = request.headers.get('x-user-role');
      
      if (userRole !== requiredRole) {
        throw new AuthorizationError('You do not have the required permissions to access this resource');
      }
      
      return await handler(request, userId, ...args);
    } catch (error) {
      if (error instanceof AuthenticationError) {
        return NextResponse.json(
          {
            success: false,
            message: error.message,
            errors: {
              authentication: [error.message],
            },
            meta: {
              timestamp: new Date(),
              version: 'v1',
            },
          },
          { status: 401 }
        );
      }
      
      if (error instanceof AuthorizationError) {
        return NextResponse.json(
          {
            success: false,
            message: error.message,
            errors: {
              authorization: [error.message],
            },
            meta: {
              timestamp: new Date(),
              version: 'v1',
            },
          },
          { status: 403 }
        );
      }
      
      logError(error as Error, {
        endpoint: request.nextUrl.pathname,
        method: request.method,
        ip: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      });
      
      return NextResponse.json(
        {
          success: false,
          message: 'An unexpected error occurred',
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
  };
}