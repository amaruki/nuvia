"use client";

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { animate } from "animejs";
import { useSession } from "@/hooks/use-session";
import { useOAuthLogin } from "@/hooks/use-oauth-login";
import { formatOAuthErrorMessage } from "@/lib/utils/oauth-utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { AuthLayoutWrapper } from "@/components/auth/auth-layout";
import { OAuthButton } from "@/components/auth/oauth-button";
import { FormMessage } from "@/components/auth/form-message";
import { FormDivider } from "@/components/auth/form-divider";
import { signupAction } from "@/lib/actions/auth.actions";

const signupSchema = z
  .object({
    fullName: z.string().min(2, "Full name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email address"),
    username: z.string().min(3, "Username must be at least 3 characters"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(
        /[^A-Za-z0-9]/,
        "Password must contain at least one special character"
      ),
    confirmPassword: z.string().min(1, "Please confirm your password"),
    agreeToTerms: z
      .boolean()
      .refine(
        (val) => val === true,
        "You must agree to the terms and conditions"
      ),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type SignupFormData = z.infer<typeof signupSchema>;

function SignupPage() {
  const { user, isPending } = useSession();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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
      window.location.href = "/dashboard";
    }
  }, [user, isPending]);

  // Animate signup card entrance
  useEffect(() => {
    animate(".signup-card", {
      translateY: [50, 0],
      opacity: [0, 1],
      duration: 1000,
      easing: "easeOutExpo",
    });
  }, []);

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

  const onSubmit = async (data: SignupFormData) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    clearOAuthError();

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
        setSuccess(
          "Account created successfully! Please check your email to verify your account."
        );
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 3000);
      } else {
        setError(result.message || "Signup failed");
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
      title="Create your account"
      subtitle="Join us today"
      footerText="Already have an account?"
      footerLink={{
        text: "Sign in",
        href: "/auth/login",
      }}
    >
      <div className="signup-card">
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
            <Label
              htmlFor="fullName"
              className="text-sm font-medium"
            >
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
              <p className="text-sm text-destructive">
                {errors.fullName.message}
              </p>
            )}
          </div>

          <div className="space-y-3">
            <Label
              htmlFor="email"
              className="text-sm font-medium"
            >
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email address"
              {...register("email")}
              className="h-10"
            />
            {errors.email && (
              <p className="text-sm text-destructive">
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-3">
            <Label
              htmlFor="username"
              className="text-sm font-medium"
            >
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
              <p className="text-sm text-destructive">
                {errors.username.message}
              </p>
            )}
          </div>

          <div className="space-y-3">
            <Label
              htmlFor="password"
              className="text-sm font-medium"
            >
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
              <p className="text-sm text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>

          <div className="space-y-3">
            <Label
              htmlFor="confirmPassword"
              className="text-sm font-medium"
            >
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
              <p className="text-sm text-destructive">
                {errors.confirmPassword.message}
              </p>
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
            <Label
              htmlFor="agreeToTerms"
              className="text-sm font-normal leading-relaxed"
            >
              I agree to the{" "}
              <a
                href="/terms"
                className="text-primary hover:underline"
              >
                Terms of Service
              </a>{" "}
              and{" "}
              <a
                href="/privacy"
                className="text-primary hover:underline"
              >
                Privacy Policy
              </a>
            </Label>
          </div>
          {errors.agreeToTerms && (
            <p className="text-sm text-destructive">
              {errors.agreeToTerms.message}
            </p>
          )}

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-10"
            onClick={handleErrorClear}
          >
            {isLoading ? "Creating Account..." : "Create Account"}
          </Button>
        </form>
      </div>
    </AuthLayoutWrapper>
  );
}

export default SignupPage;