"use client";

import { useState, useEffect, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { animate } from "animejs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { resetPasswordAction } from "@/lib/actions/auth.actions";
import { logger } from "@/lib/logger";
import { FormMessage } from "@/components/auth/form-message";

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (_data: ResetPasswordFormData) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    setValidationErrors({});

    try {
      const formData = new FormData();
      formData.append("token", token || "");
      formData.append("password", password);
      formData.append("confirmPassword", confirmPassword);

      const result = await resetPasswordAction(formData);

      if (result.success) {
        setSuccess(
          "Password has been reset successfully. You can now sign in with your new password.",
        );
        // Redirect after a delay
        setTimeout(() => {
          router.push("/auth/login");
        }, 3000);
      } else {
        setError(result.message || "Failed to reset password");

        // Set validation errors if they exist
        if (result.errors) {
          setValidationErrors(result.errors);
        }
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      logger.error("An unexpected error occurred. Please try again.", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Animate reset password card entrance
    animate(".reset-password-card", {
      translateY: [50, 0],
      opacity: [0, 1],
      duration: 1000,
      easing: "easeOutExpo",
    });
  }, []);

  const getErrorMessage = (field: string) => {
    return validationErrors[field]?.[0];
  };

  const hasError = (field: string) => {
    return !!validationErrors[field]?.length;
  };

  // If no token is provided, show an error
  if (!token) {
    return (
      <>
        <div className="min-h-screen w-full flex items-center justify-center p-4 bg-background">
          <div className="w-full max-w-md">
            {/* Logo and title */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-4 bg-foreground">
                <svg
                  className="w-6 h-6 text-background"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  ></path>
                </svg>
              </div>
              <h1 className="text-2xl font-semibold text-foreground">Invalid Request</h1>
              <p className="text-sm mt-1 text-muted-foreground">
                The password reset link is invalid or has expired.
              </p>
            </div>

            {/* Error message */}
            <FormMessage
              type="error"
              message="Please request a new password reset link to continue."
            />

            {/* Reset password form */}
            <div className="rounded-2xl border p-8 shadow-sm bg-card border-border space-y-4">
              <div className="text-center">
                <Button asChild className="w-full h-10">
                  <Link href="/auth/forgot-password">Request New Reset Link</Link>
                </Button>
              </div>

              {/* Back to login link */}
              <p className="text-center text-sm text-muted-foreground">
                Remember your password?{" "}
                <Link href="/auth/login" className="font-medium hover:underline text-primary">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="min-h-screen w-full flex items-center justify-center p-4 bg-background">
        <div className="w-full max-w-md">
          {/* Logo and title */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-4 bg-foreground">
              <svg
                className="w-6 h-6 text-background"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                ></path>
              </svg>
            </div>
            <h1 className="text-2xl font-semibold text-foreground">Reset Your Password</h1>
            <p className="text-sm mt-1 text-muted-foreground">Enter your new password below</p>
          </div>

          {error && <FormMessage type="error" message={error} />}

          {success && <FormMessage type="success" message={success} />}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-3">
              <Label htmlFor="password" className="text-sm font-medium">
                New Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                required
                className={`h-10 ${hasError("password") ? "border-destructive" : ""}`}
                value={password}
                {...register("password", {
                  onChange: (e) => setPassword(e.target.value),
                })}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
              {hasError("password") && (
                <p className="text-sm text-destructive">{getErrorMessage("password")}</p>
              )}
            </div>

            <div className="space-y-3">
              <Label htmlFor="confirmPassword" className="text-sm font-medium">
                Confirm New Password
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                required
                className={`h-10 ${hasError("confirmPassword") ? "border-destructive" : ""}`}
                value={confirmPassword}
                {...register("confirmPassword", {
                  onChange: (e) => setConfirmPassword(e.target.value),
                })}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
              )}
              {hasError("confirmPassword") && (
                <p className="text-sm text-destructive">{getErrorMessage("confirmPassword")}</p>
              )}
            </div>

            <Button type="submit" disabled={isLoading} className="w-full h-10">
              {isLoading ? "Resetting Password" : "Reset Password"}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-card px-4 text-foreground">Or return to</span>
            </div>
          </div>

          {/* Back to login link */}
          <p className="text-center text-sm text-muted-foreground">
            Remember your password?{" "}
            <Link href="/auth/login" className="font-medium hover:underline text-primary">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <>
      <Suspense fallback={<div>Loading...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </>
  );
}
