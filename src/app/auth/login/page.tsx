"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { animate } from "animejs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";
import Image from "next/image";
import { loginAction } from "@/lib/actions/auth.actions";
import { signInWithOAuthAction } from "@/lib/actions/oauth-better-auth.actions";

const loginSchema = z.object({
  emailOrUsername: z.string().min(1, "Email or username is required"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

function LoginForm() {
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isOAuthLoading, setIsOAuthLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

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

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const formData = new FormData();
      formData.append("emailOrUsername", emailOrUsername);
      formData.append("password", password);

      const result = await loginAction(formData);

      if (result.success) {
        setSuccess("Login successful! Redirecting...");
        // In a real implementation, you would store the user session/token here
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

  const handleOAuthLogin = async (provider: string) => {
    console.log(`Initiating ${provider} OAuth login...`);
    setError(null);
    setSuccess(null);
    setIsOAuthLoading(true);

    try {
      console.log(`Starting ${provider} OAuth with better-auth...`);
      const result = await signInWithOAuthAction(provider, "/dashboard");

      console.log(`${provider} OAuth result:`, result);

      if (result.success) {
        // Redirect to OAuth URL provided by better-auth
        if (result.data?.url) {
          console.log(`Redirecting to ${provider} OAuth:`, result.data.url);
          window.location.href = result.data.url;
        } else {
          console.error("No redirect URL in OAuth response");
          setError("Invalid authorization URL received");
        }
      } else {
        console.error("OAuth action failed:", result.message);
        setError(result.message || `Failed to initialize ${provider} login`);
      }
    } catch (err) {
      console.error(`Error during ${provider} OAuth login:`, err);
      setError(
        `An unexpected error occurred with ${provider} login. Please try again.`
      );
    } finally {
      setIsOAuthLoading(false);
    }
  };

  const handleGoogleLogin = () => handleOAuthLogin("google");

  useEffect(() => {
    // Check for OAuth callback parameters
    const error = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");
    const provider = searchParams.get("provider");

    if (error) {
      let errorMessage = errorDescription || error;

      // Handle specific OAuth conflict error
      if (error === "oauth_conflict") {
        errorMessage =
          errorDescription ||
          `This email is already registered with a different authentication method. Please sign in using the same method you used to register.`;
      }

      setError(errorMessage);
      // Clean up URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    // Animate login card entrance
    animate(".login-card", {
      translateY: [50, 0],
      opacity: [0, 1],
      duration: 1000,
      easing: "easeOutExpo",
    });
  }, [searchParams]);

  return (
    <>
      {/* Login card - responsive width and padding */}
      <div className="min-h-screen w-full flex items-center justify-center p-4 bg-background">
        <div className="w-full max-w-md">
          {/* Logo and title */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-4 bg-foreground">
              <Image
                src="/logo.png"
                alt="Nuvia Logo"
                width={60}
                height={60}
                className="rounded-md"
              />
            </div>
            <h1 className="text-2xl font-semibold text-foreground">
              Welcome back
            </h1>
            <p className="text-sm mt-1 text-muted-foreground">
              Sign in to continue
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3 rounded-lg border bg-destructive/10 border-destructive/30">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 p-3 rounded-lg border bg-primary/10 border-primary/30">
              <p className="text-sm text-primary">{success}</p>
            </div>
          )}

          {/* Login form */}
          <div className="login-card rounded-2xl border p-8 shadow-sm bg-card border-border">
            {/* Social login */}
            <div className="space-y-3">
              {/* Google OAuth */}
              <Button
                type="button"
                variant="outline"
                onClick={handleGoogleLogin}
                disabled={isLoading || isOAuthLoading}
                className="w-full h-10 justify-center gap-3"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span>{isOAuthLoading ? "Connecting..." : "Google"}</span>
              </Button>
            </div>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-card px-4 text-foreground">
                  Or continue with
                </span>
              </div>
            </div>

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
                  value={emailOrUsername}
                  {...register("emailOrUsername", {
                    onChange: (e) => setEmailOrUsername(e.target.value),
                  })}
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
                  <Link
                    href="/auth/forgot-password"
                    className="text-sm hover:underline text-primary"
                  >
                    Forgot your password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  {...register("password", {
                    onChange: (e) => setPassword(e.target.value),
                  })}
                  className="h-10"
                />
                {errors.password && (
                  <p className="text-sm text-destructive">
                    {errors.password.message}
                  </p>
                )}
              </div>
              {/* Remember Me */}
              <div className="flex items-center space-x-2">
                <Checkbox id="rememberMe" {...register("rememberMe")} />
                <Label
                  htmlFor="rememberMe"
                  className="text-sm font-normal cursor-pointer"
                >
                  Remember me
                </Label>
              </div>

              {/* Submit Button */}
              <Button
                onClick={handleSubmit(onSubmit)}
                disabled={isLoading}
                className="w-full h-10"
              >
                {isLoading ? "Signing in..." : "Sign in"}
              </Button>
            </form>

            {/* Sign up link */}
            <p className="text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link
                href="/auth/signup"
                className="font-medium hover:underline text-primary"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>  
      </div>  
    </>
  );
}

export default function LoginPage() {
  return (
    <>
      <Suspense fallback={<div>Loading...</div>}>
        <LoginForm />
      </Suspense>
    </>
  );
}
