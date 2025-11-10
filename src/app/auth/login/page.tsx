"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { animate } from "animejs";
import { useSession } from "@/hooks/use-session";
import { useOAuthLogin } from "@/hooks/use-oauth-login";
import { extractOAuthError, cleanOAuthUrlParams, formatOAuthErrorMessage } from "@/lib/utils/oauth-utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { AuthLayoutWrapper } from "@/components/auth/auth-layout";
import { OAuthButton } from "@/components/auth/oauth-button";
import { FormMessage } from "@/components/auth/form-message";
import { FormDivider } from "@/components/auth/form-divider";
import { loginAction } from "@/lib/actions/auth.actions";

const loginSchema = z.object({
  emailOrUsername: z.string().min(1, "Email or username is required"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isPending } = useSession();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      rememberMe: false,
    },
  });

  const {
    signInWithGoogle,
    isLoading: isOAuthLoading,
    error: oauthError,
    clearError: clearOAuthError,
  } = useOAuthLogin({
    onError: (error) => {
      setError(formatOAuthErrorMessage(error));
    },
  });

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (!isPending && user) {
      router.push("/dashboard");
    }
  }, [user, isPending, router]);

  // Handle OAuth callback errors and animations
  useEffect(() => {
    // Check for OAuth callback errors
    const oauthError = extractOAuthError(searchParams);
    if (oauthError) {
      setError(formatOAuthErrorMessage(oauthError));
      cleanOAuthUrlParams();
    }

    // Animate login card entrance
    animate(".login-card", {
      translateY: [50, 0],
      opacity: [0, 1],
      duration: 1000,
      easing: "easeOutExpo",
    });
  }, [searchParams]);

  // Show loading state while checking authentication
  if (isPending) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-4 bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    );
  }

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    clearOAuthError();

    try {
      const formData = new FormData();
      formData.append("emailOrUsername", data.emailOrUsername);
      formData.append("password", data.password);

      const result = await loginAction(formData);

      if (result.success) {
        setSuccess("Login successful! Redirecting...");
        setTimeout(() => {
          router.push("/dashboard");
        }, 1500);
      } else {
        setError(result.message || "Login failed");
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleErrorClear = () => {
    setError(null);
    clearOAuthError();
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
        {/* OAuth Error */}
        {(error || oauthError) && (
          <FormMessage
            type="error"
            message={error || formatOAuthErrorMessage(oauthError!)}
          />
        )}

        {/* Success Message */}
        {success && (
          <FormMessage
            type="success"
            message={success}
          />
        )}

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
            <Label
              htmlFor="emailOrUsername"
              className="text-sm font-medium"
            >
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
              <p className="text-sm text-destructive">
                {errors.emailOrUsername.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <a
                href="/auth/forgot-password"
                className="text-sm hover:underline text-primary"
              >
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
              <p className="text-sm text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox id="rememberMe" {...register("rememberMe")} />
            <Label
              htmlFor="rememberMe"
              className="text-sm font-normal cursor-pointer"
            >
              Remember me
            </Label>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-10"
            onClick={handleErrorClear}
          >
            {isLoading ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </div>
    </AuthLayoutWrapper>
  );
}

export default function LoginPage() {
  return <LoginForm />;
}