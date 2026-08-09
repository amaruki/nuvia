"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { animate } from "animejs";
import { useSession } from "@/hooks/use-session";
import { useOAuthLogin } from "@/hooks/use-oauth-login";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { AuthLayoutWrapper } from "@/components/auth/auth-layout";
import { OAuthButton } from "@/components/auth/oauth-button";
import { FormDivider } from "@/components/auth/form-divider";
import { signupAction } from "@/lib/actions/auth.actions";
import { logger } from "@/lib/logger";
import { toast } from "sonner";

const signupSchema = z
  .object({
    fullName: z.string().min(2, "Full name must be at least 2 characters"),
    email: z.email("Please enter a valid email address"),
    username: z.string().min(3, "Username must be at least 3 characters"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
    agreeToTerms: z
      .boolean()
      .refine((val) => val === true, "You must agree to the terms and conditions"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type SignupFormData = z.infer<typeof signupSchema>;

function SignupPage() {
  const { user, isPending } = useSession();

  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      agreeToTerms: false,
    },
  });

  const { signInWithGoogle, isLoading: isOAuthLoading } = useOAuthLogin({
    onError: (error) => {
      toast.error(error.message || "OAuth sign-in failed");
    },
  });

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (!isPending && user) {
      // Clear any potential errors before redirecting
      // Import cleanOAuthUrlParams if needed or use simple URL cleanup
      if (typeof window !== "undefined") {
        const url = new URL(window.location.href);
        const params = url.searchParams;
        params.delete("error");
        params.delete("error_description");
        params.delete("code");
        params.delete("state");
        const newUrl = `${url.pathname}${params.toString() ? `?${params.toString()}` : ""}`;
        window.history.replaceState({}, "", newUrl);
      }
      window.location.href = "/dashboard";
      return; // Prevent any further rendering
    }
  }, [user, isPending]);

  // Animate signup card entrance only if user is not authenticated
  useEffect(() => {
    if (!user && !isPending) {
      animate(".signup-card", {
        translateY: [50, 0],
        opacity: [0, 1],
        duration: 1000,
        easing: "easeOutExpo",
      });
    }
  }, [user, isPending]);

  // Show loading state only while checking authentication (not for authenticated users)
  if (isPending || user) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-4 bg-background">
        <div className="text-center">
          <LoadingSpinner size="md" className="mx-auto mb-4" />
          <p className="text-muted-foreground">
            {isPending ? "Checking authentication..." : "Redirecting..."}
          </p>
        </div>
      </div>
    );
  }

  const onSubmit = async (data: SignupFormData) => {
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("email", data.email);
      formData.append("username", data.username);
      formData.append("fullName", data.fullName);
      formData.append("password", data.password);
      formData.append("confirmPassword", data.confirmPassword);
      formData.append("agreeToTerms", data.agreeToTerms ? "true" : "false");

      const result = await signupAction(formData);

      if (result.success) {
        toast.success(
          "Account created successfully! Please check your email to verify your account, then sign in.",
        );
        setTimeout(() => {
          window.location.href = "/auth/login";
        }, 3000);
      } else {
        toast.error(result.message || "Signup failed");
      }
    } catch (err) {
      toast.error("An unexpected error occurred. Please try again.");
      logger.error("An unexpected error occurred. Please try again.", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayoutWrapper
      title="Create your account"
      subtitle="Join us today"
      footerText="Already have an account?"
      footerLink={{
        text: "Sign in",
        href: "/auth/login",
      }}
    >
      <div className="signup-card">
        {/* Social Signup */}
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

        {/* Signup Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 my-6">
          <div className="space-y-3">
            <Label htmlFor="fullName" className="text-sm font-medium">
              Full Name
            </Label>
            <Input
              id="fullName"
              type="text"
              placeholder="Enter your full name"
              {...register("fullName")}
              className="h-10"
            />
            {errors.fullName && (
              <p className="text-sm text-destructive">{errors.fullName.message}</p>
            )}
          </div>

          <div className="space-y-3">
            <Label htmlFor="email" className="text-sm font-medium">
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email address"
              {...register("email")}
              className="h-10"
            />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-3">
            <Label htmlFor="username" className="text-sm font-medium">
              Username
            </Label>
            <Input
              id="username"
              type="text"
              placeholder="Choose a username"
              {...register("username")}
              className="h-10"
            />
            {errors.username && (
              <p className="text-sm text-destructive">{errors.username.message}</p>
            )}
          </div>

          <div className="space-y-3">
            <Label htmlFor="password" className="text-sm font-medium">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="Create a password"
              {...register("password")}
              className="h-10"
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-3">
            <Label htmlFor="confirmPassword" className="text-sm font-medium">
              Confirm Password
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Confirm your password"
              {...register("confirmPassword")}
              className="h-10"
            />
            {errors.confirmPassword && (
              <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
            )}
          </div>

          <div className="flex items-start space-x-2">
            <Controller
              name="agreeToTerms"
              control={control}
              render={({ field }) => (
                <Checkbox
                  id="agreeToTerms"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
            <Label htmlFor="agreeToTerms" className="text-sm font-normal leading-relaxed">
              I agree to the{" "}
              <Link href="/terms" className="text-primary hover:underline">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="text-primary hover:underline">
                Privacy Policy
              </Link>
            </Label>
          </div>
          {errors.agreeToTerms && (
            <p className="text-sm text-destructive">{errors.agreeToTerms.message}</p>
          )}

          <Button type="submit" disabled={isLoading} className="w-full h-10">
            {isLoading ? "Creating Account..." : "Create Account"}
          </Button>
        </form>
      </div>
    </AuthLayoutWrapper>
  );
}

export default SignupPage;
