import { NextRequest, NextResponse } from 'next/server';
import { OAuthService } from '@/lib/services/oauth.service';
import { authClient } from '@/lib/client';
import { prisma } from '@/lib/prisma';

// List of supported OAuth providers
const SUPPORTED_PROVIDERS = ['google', 'github', 'linkedin'];

/**
 * Create OAuth account manually if it wasn't created automatically
 *
 * @param userId - The user ID
 * @param provider - The OAuth provider
 * @param email - The user's email
 * @param accountId - The OAuth account ID
 * @param additionalData - Additional OAuth data
 */
async function createOAuthAccount(
  userId: string,
  provider: string,
  email: string,
  accountId: string,
  additionalData?: {
    refreshToken?: string;
    accessToken?: string;
    accessTokenExpiresAt?: Date;
    scope?: string;
    idToken?: string;
  }
) {
  try {
    // Check if account already exists
    const existingAccount = await prisma.account.findUnique({
      where: {
        providerId_accountId: {
          providerId: provider,
          accountId: accountId,
        },
      },
    });

    if (existingAccount) {
      console.log(`OAuth account already exists for user ${email} with provider ${provider}`);
      return existingAccount;
    }

    // Create the OAuth account
    const newAccount = await prisma.account.create({
      data: {
        userId,
        providerId: provider,
        accountId,
        ...additionalData,
      },
    });

    console.log(`Created OAuth account for user ${email} with provider ${provider}`);
    return newAccount;
  } catch (error) {
    console.error('Error creating OAuth account:', error);
    throw error;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;
  
  
  // Validate the provider
  if (!SUPPORTED_PROVIDERS.includes(provider)) {
    console.error("Unsupported OAuth provider:", provider);

    const errorUrl = new URL(`${process.env.APP_URL}/auth/callback`);
    errorUrl.searchParams.set('error', 'unsupported_provider');
    errorUrl.searchParams.set('error_description', `Unsupported OAuth provider: ${provider}`);
    
    return NextResponse.redirect(errorUrl);
  }

  try {
    // Extract OAuth callback parameters
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    
    // If there's an error, redirect to the callback page with error details
    if (error) {
      console.error("OAuth callback error:", { provider, error });
      
      const errorUrl = new URL(`${process.env.APP_URL}/auth/callback`);
      errorUrl.searchParams.set('error', error);
      errorUrl.searchParams.set('provider', provider);
      if (errorDescription) {
        errorUrl.searchParams.set('error_description', errorDescription);
      }
      
      return NextResponse.redirect(errorUrl);
    }

    // If we have code and state, we need to validate the OAuth sign-in
    if (code && state) {
      // First, let's try to get the user info from the OAuth provider
      // We'll use the auth client to handle the OAuth callback
      try {
        // This will process the OAuth callback and create a session
        const { data: session, error: authError } = await authClient.getSession({
          fetchOptions: {
            headers: {
              cookie: request.headers.get('cookie') || '',
            },
          },
        });

        // If there's an authentication error, check if it's an email conflict
        if (authError) {
          console.error("OAuth authentication error:", authError);
          
          // Check if the error is related to email conflict
          if (authError.message?.includes('email') || authError.message?.includes('account')) {
            // Try to extract user email from the error or session data
            let userEmail = '';
            
            // If we can get the email, validate it
            if (userEmail) {
              const validation = await OAuthService.validateOAuthSignIn(userEmail, provider);
              
              if (!validation.isValid) {
                const errorUrl = new URL(`${process.env.APP_URL}/auth/callback`);
                errorUrl.searchParams.set('error', 'oauth_conflict');
                errorUrl.searchParams.set('provider', provider);
                errorUrl.searchParams.set('error_description', validation.error || 'OAuth authentication conflict');
                
                return NextResponse.redirect(errorUrl);
              }
            }
          }
          
          // If it's not an email conflict, redirect with the original error
          const errorUrl = new URL(`${process.env.APP_URL}/auth/callback`);
          errorUrl.searchParams.set('error', 'oauth_failed');
          errorUrl.searchParams.set('provider', provider);
          errorUrl.searchParams.set('error_description', authError.message || 'OAuth authentication failed');
          
          return NextResponse.redirect(errorUrl);
        }

        // If authentication was successful, check for email conflicts
        if (session?.user?.email) {
          const validation = await OAuthService.validateOAuthSignIn(session.user.email, provider);
          
          if (!validation.isValid) {
            // If there's a conflict, we need to sign out the user and show the error
            await authClient.signOut();
            
            const errorUrl = new URL(`${process.env.APP_URL}/auth/callback`);
            errorUrl.searchParams.set('error', 'oauth_conflict');
            errorUrl.searchParams.set('provider', provider);
            errorUrl.searchParams.set('error_description', validation.error || 'OAuth authentication conflict');
            
            return NextResponse.redirect(errorUrl);
          }
          
          // Check if the OAuth account was properly created in the database
          try {
            const userWithAccounts = await OAuthService.getUserWithAuthMethods(session.user.email);
            const hasOAuthAccount = userWithAccounts?.accounts.some(
              account => account.providerId === provider
            );
            
            if (!hasOAuthAccount) {
              console.warn(`OAuth account not found for user ${session.user.email} with provider ${provider}`);
              
              // Try to get OAuth account information from the session
              // We'll need to extract the account ID from the OAuth provider
              // For now, we'll use a placeholder and log a warning
              const oauthAccountId = session.user.id || `oauth_${provider}_${Date.now()}`;
              
              // Create the OAuth account manually
              try {
                await createOAuthAccount(
                  session.user.id,
                  provider,
                  session.user.email,
                  oauthAccountId,
                  {
                    // Add any additional OAuth data if available
                    // This would typically come from the OAuth provider's response
                  }
                );
              } catch (createError) {
                console.error("Failed to create OAuth account manually:", createError);
                // Continue with the flow even if account creation fails
                // The user is still authenticated, just the OAuth account isn't linked
              }
            }
          } catch (dbError) {
            console.error("Error checking OAuth account creation:", dbError);
          }
        }

        // If everything is fine, redirect to the main callback page
        const callbackUrl = new URL(`${process.env.APP_URL}/auth/callback`);
        callbackUrl.searchParams.set('code', code);
        callbackUrl.searchParams.set('state', state);
        callbackUrl.searchParams.set('provider', provider);
        
        return NextResponse.redirect(callbackUrl);
      } catch (authError) {
        console.error("OAuth session processing error:", authError);
        
        const errorUrl = new URL(`${process.env.APP_URL}/auth/callback`);
        errorUrl.searchParams.set('error', 'oauth_failed');
        errorUrl.searchParams.set('provider', provider);
        errorUrl.searchParams.set('error_description', 'Failed to process OAuth authentication');
        
        return NextResponse.redirect(errorUrl);
      }
    }

    // If we're missing required parameters, redirect with error
    console.error("Missing OAuth callback parameters:", { provider });

    const errorUrl = new URL(`${process.env.APP_URL}/auth/callback`);
    errorUrl.searchParams.set('error', 'missing_parameters');
    errorUrl.searchParams.set('provider', provider);
    errorUrl.searchParams.set('error_description', 'Missing required OAuth callback parameters');
    
    return NextResponse.redirect(errorUrl);
  } catch (err) {
    console.error("OAuth callback unexpected error:", err instanceof Error ? err.message : String(err));

    const errorUrl = new URL(`${process.env.APP_URL}/auth/callback`);
    errorUrl.searchParams.set('error', 'server_error');
    errorUrl.searchParams.set('provider', provider);
    errorUrl.searchParams.set('error_description', 'An unexpected error occurred during OAuth callback');
    
    return NextResponse.redirect(errorUrl);
  }
}