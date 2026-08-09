"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { animate } from "animejs";
import { useSession } from "@/hooks/use-session";
import { useOAuthLogin } from "@/hooks/use-oauth-login";
import { extractOAuthError, cleanOAuthUrlParams } from "@/lib/utils/oauth-utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { AuthLayoutWrapper } from "@/components/auth/auth-layout";
import { OAuthButton } from "@/components/auth/oauth-button";
import { FormDivider } from "@/components/auth/form-divider";
import { loginAction } from "@/lib/actions/auth.actions";
import { logger } from "@/lib/logger";
import { toast } from "sonner";

const loginSchema = z.object({
  emailOrUsername: z.string().min(1, "Email or username is required"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

function LoginForm() {
  const searchParams = useSearchParams();
  const { user, isPending } = useSession();

  const [isLoading, setIsLoading] = useState(false);
  const redirectedRef = useRef(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      rememberMe: false,
    },
  });

  const { signInWithGoogle, isLoading: isOAuthLoading } = useOAuthLogin({
    onError: (error) => {
      toast.error(error.message || "OAuth sign-in failed");
    },
  });

  // Redirect authenticated users to dashboard or requested page.
  //
  // Hard-navigate so the session is re-validated by a full page load. A soft
  // router.push keeps better-auth's in-memory session store alive; if that
  // store is stale (session revoked server-side), the middleware bounces
  // /dashboard back here and the stale store pushes straight back again — an
  // infinite login/dashboard redirect loop.
  //
  // Two loop hazards this effect must avoid:
  //  1. No cleanOAuthUrlParams() here — its history.replaceState makes Next.js
  //     refresh useSearchParams(), which re-runs this effect, and every re-run
  //     aborts the in-flight /dashboard navigation before it can commit.
  //  2. redirectedRef guards against re-runs issuing repeated assigns.
  useEffect(() => {
    if (!isPending && user && !redirectedRef.current) {
      redirectedRef.current = true;
      const redirectTo = searchParams.get("redirectTo");
      const target =
        redirectTo && redirectTo.startsWith("/") && !redirectTo.startsWith("//")
          ? redirectTo
          : "/dashboard";
      window.location.assign(target);
    }
  }, [user, isPending, searchParams]);

  // Handle OAuth callback errors and animations
  useEffect(() => {
    // Only check for OAuth errors if user is NOT authenticated
    if (!user && !isPending) {
      const oauthError = extractOAuthError(searchParams);
      if (oauthError) {
        toast.error(oauthError.message || "OAuth sign-in failed");
        cleanOAuthUrlParams();
      }
    }

    // Animate login card entrance only if user is not authenticated
    if (!user && !isPending) {
      animate(".login-card", {
        translateY: [50, 0],
        opacity: [0, 1],
        duration: 1000,
        easing: "easeOutExpo",
      });
    }
  }, [searchParams, user, isPending]);

  // Show loading state while checking authentication OR redirecting
  if (isPending || user) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-4 bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">
            {isPending ? "Checking authentication..." : "Redirecting..."}
          </p>
        </div>
      </div>
    );
  }

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    let navigating = false;

    try {
      const formData = new FormData();
      formData.append("emailOrUsername", data.emailOrUsername);
      formData.append("password", data.password);

      const result = await loginAction(formData);

      if (result.success) {
        const redirectTo = searchParams.get("redirectTo");
        const target =
          redirectTo && redirectTo.startsWith("/") && !redirectTo.startsWith("//")
            ? redirectTo
            : "/dashboard";
        // Hard-navigate rather than router.push: the session cookie has just
        // landed, but better-auth's client session store still holds the
        // pre-login "no session" result. A full page load re-fetches the
        // session with the cookie, so protected pages render for the signed-in
        // user instead of flashing "you must be logged in".
        navigating = true;
        window.location.assign(target);
        return;
      }

      toast.error(result.message || "Login failed");
    } catch (err) {
      toast.error("An unexpected error occurred. Please try again.");
      logger.error("An unexpected error occurred. Please try again.", err);
    } finally {
      if (!navigating) {
        setIsLoading(false);
      }
    }
  };

  return (
    <AuthLayoutWrapper
      title="Welcome back"
      subtitle="Sign in to continue"
      footerText="Don't have an account?"
      footerLink={{
        text: "Sign up",
        href: "/auth/signup",
      }}
    >
      <div className="login-card">
        {/* Social Login */}
        <div className="space-y-3">
          <OAuthButton
            provider="google"
            isLoading={isOAuthLoading}
            onClick={signInWithGoogle}
            disabled={isLoading}
          />
        </div>

        {/* Divider */}
        <FormDivider text="Or continue with" />

        {/* Login Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 my-6">
          <div className="space-y-3">
            <Label htmlFor="emailOrUsername" className="text-sm font-medium">
              Email or Username
            </Label>
            <Input
              id="emailOrUsername"
              type="text"
              placeholder="Enter your email"
              {...register("emailOrUsername")}
              className="h-10"
            />
            {errors.emailOrUsername && (
              <p className="text-sm text-destructive">{errors.emailOrUsername.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <a href="/auth/forgot-password" className="text-sm hover:underline text-primary">
                Forgot your password?
              </a>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              {...register("password")}
              className="h-10"
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Controller
              name="rememberMe"
              control={control}
              render={({ field }) => (
                <Checkbox id="rememberMe" checked={field.value} onCheckedChange={field.onChange} />
              )}
            />
            <Label htmlFor="rememberMe" className="text-sm font-normal cursor-pointer">
              Remember me
            </Label>
          </div>

          <Button type="submit" disabled={isLoading} className="w-full h-10">
            {isLoading ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </div>
    </AuthLayoutWrapper>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
