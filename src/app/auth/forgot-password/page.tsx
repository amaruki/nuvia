"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { animate } from "animejs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { forgotPasswordAction } from "@/lib/actions/auth.actions";
import { logger } from "@/lib/logger";
import { FormMessage } from "@/components/auth/form-message";

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (_data: ForgotPasswordFormData) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    setValidationErrors({});

    try {
      const formData = new FormData();
      formData.append("email", email);

      const result = await forgotPasswordAction(formData);

      if (result.success) {
        setSuccess("Password reset instructions have been sent to your email.");
        // Redirect after a delay
        setTimeout(() => {
          router.push("/auth/login");
        }, 5000);
      } else {
        setError(result.message || "Failed to send password reset instructions");

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
    // Animate forgot password card entrance
    animate(".forgot-password-card", {
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

  return (
    <>
      {/* Forgot password card - responsive width and padding */}
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
            <h1 className="text-2xl font-semibold text-foreground">Reset your password</h1>
            <p className="text-sm mt-1 text-muted-foreground">
              {success
                ? "Check your email for reset instructions"
                : "Enter your email to reset your password"}
            </p>
          </div>

          {error && <FormMessage type="error" message={error} />}

          {success && <FormMessage type="success" message={success} />}

          {/* Forgot password form */}
          <div className="forgot-password-card rounded-2xl border p-8 shadow-sm bg-card border-border">
            {!success ? (
              <>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  <div className="space-y-3">
                    <Label htmlFor="email" className="text-sm font-medium">
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email address"
                      className={`h-10 ${hasError("email") ? "border-destructive" : ""}`}
                      value={email}
                      {...register("email", {
                        onChange: (e) => setEmail(e.target.value),
                      })}
                    />
                    {errors.email && (
                      <p className="text-sm text-destructive">{errors.email.message}</p>
                    )}
                    {hasError("email") && (
                      <p className="text-sm text-destructive">{getErrorMessage("email")}</p>
                    )}
                  </div>

                  <Button type="submit" disabled={isLoading} className="w-full h-10">
                    {isLoading ? "Sending Email..." : "Reset Password"}
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
              </>
            ) : (
              <>
                {/* Success message area - already handled above */}

                {/* Divider */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="bg-card px-4 text-foreground">Need more help?</span>
                  </div>
                </div>
              </>
            )}

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
