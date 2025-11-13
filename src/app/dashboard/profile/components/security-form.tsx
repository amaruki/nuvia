"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { Key, CheckCircle, AlertCircle, Eye, EyeOff, Loader2, Shield, Check } from "lucide-react";

import { changePassword } from "@/lib/client";

// Simple password validation schema
const passwordFormSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password must be less than 100 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^a-zA-Z0-9]/, "Password must contain at least one special character"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
}).refine(data => data.currentPassword !== data.newPassword, {
  message: "New password must be different from current password",
  path: ["newPassword"],
});

type PasswordFormData = z.infer<typeof passwordFormSchema>;

interface SecurityFormProps {
  user: any;
}

export function SecurityForm({ user }: SecurityFormProps) {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
    }
  });

  const newPassword = watch("newPassword");

  // Password requirements checker
  const checkPasswordRequirements = (password: string) => {
    if (!password) {
      return {
        minLength: false,
        hasUppercase: false,
        hasLowercase: false,
        hasNumber: false,
        hasSpecialChar: false,
        score: 0
      };
    }

    const requirements = {
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecialChar: /[^a-zA-Z\d]/.test(password)
    };

    const score = Object.values(requirements).filter(Boolean).length;

    return { ...requirements, score };
  };

  const passwordRequirements = checkPasswordRequirements(newPassword || "");

  const getStrengthText = (score: number) => {
    const strengthLevels = ["Very Weak", "Weak", "Fair", "Good", "Strong"];
    return strengthLevels[Math.min(score - 1, strengthLevels.length - 1)] || "Very Weak";
  };

  const getStrengthColor = (score: number) => {
    if (score <= 2) return "text-red-500";
    if (score === 3) return "text-yellow-500";
    return "text-green-500";
  };

  const getProgressBarColor = (score: number) => {
    if (score <= 2) return "bg-red-500";
    if (score === 3) return "bg-yellow-500";
    return "bg-green-500";
  };

  const onSubmit = async (data: PasswordFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
        confirmPassword: data.confirmPassword,
      });

      if (result.success) {
        setIsSuccess(true);
        // Reset form
        handleSubmit(() => {})();
        setTimeout(() => setIsSuccess(false), 3000);
      } else {
        setError(result.message || "Failed to change password");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Success Message */}
      {isSuccess && (
        <Alert className="border-green-200 bg-green-50 text-green-800">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Password changed successfully!
          </AlertDescription>
        </Alert>
      )}

      {/* Error Message */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Current Password */}
      <div className="space-y-2">
        <Label htmlFor="currentPassword">Current Password</Label>
        <div className="relative">
          <Input
            id="currentPassword"
            type={showCurrentPassword ? "text" : "password"}
            placeholder="Enter your current password"
            {...register("currentPassword")}
            disabled={isSubmitting}
            className={errors.currentPassword ? "border-red-500 pr-10" : "pr-10"}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
            disabled={isSubmitting}
          >
            {showCurrentPassword ? (
              <EyeOff className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Eye className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
        </div>
        {errors.currentPassword && (
          <p className="text-sm text-red-600">{errors.currentPassword.message}</p>
        )}
      </div>

      {/* New Password */}
      <div className="space-y-2">
        <Label htmlFor="newPassword">New Password</Label>
        <div className="relative">
          <Input
            id="newPassword"
            type={showNewPassword ? "text" : "password"}
            placeholder="Enter your new password"
            {...register("newPassword")}
            disabled={isSubmitting}
            className={errors.newPassword ? "border-red-500 pr-10" : "pr-10"}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={() => setShowNewPassword(!showNewPassword)}
            disabled={isSubmitting}
          >
            {showNewPassword ? (
              <EyeOff className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Eye className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
        </div>
        {errors.newPassword && (
          <p className="text-sm text-red-600">{errors.newPassword.message}</p>
        )}

        {/* Password Strength Indicator */}
        {newPassword && (
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Password Strength:</span>
              <Badge
                variant="outline"
                className={`text-xs ${getStrengthColor(passwordRequirements.score)} border-current`}
              >
                {getStrengthText(passwordRequirements.score)}
              </Badge>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${getProgressBarColor(passwordRequirements.score)}`}
                style={{ width: `${(passwordRequirements.score / 5) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Confirm Password */}
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm New Password</Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Confirm your new password"
            {...register("confirmPassword")}
            disabled={isSubmitting}
            className={errors.confirmPassword ? "border-red-500 pr-10" : "pr-10"}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            disabled={isSubmitting}
          >
            {showConfirmPassword ? (
              <EyeOff className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Eye className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
        </div>
        {errors.confirmPassword && (
          <p className="text-sm text-red-600">{errors.confirmPassword.message}</p>
        )}
      </div>

      {/* Password Requirements */}
      <Card className="bg-muted/30">
        <CardContent className="p-4">
          <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Password Requirements:
          </h4>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li className={`flex items-center gap-2 ${passwordRequirements.minLength ? 'text-green-600' : ''}`}>
              {passwordRequirements.minLength ? (
                <Check className="h-3 w-3 text-green-600" />
              ) : (
                <span className="w-3 h-3 inline-block" />
              )}
              At least 8 characters long
            </li>
            <li className={`flex items-center gap-2 ${passwordRequirements.hasUppercase ? 'text-green-600' : ''}`}>
              {passwordRequirements.hasUppercase ? (
                <Check className="h-3 w-3 text-green-600" />
              ) : (
                <span className="w-3 h-3 inline-block" />
              )}
              Contains uppercase letter
            </li>
            <li className={`flex items-center gap-2 ${passwordRequirements.hasLowercase ? 'text-green-600' : ''}`}>
              {passwordRequirements.hasLowercase ? (
                <Check className="h-3 w-3 text-green-600" />
              ) : (
                <span className="w-3 h-3 inline-block" />
              )}
              Contains lowercase letter
            </li>
            <li className={`flex items-center gap-2 ${passwordRequirements.hasNumber ? 'text-green-600' : ''}`}>
              {passwordRequirements.hasNumber ? (
                <Check className="h-3 w-3 text-green-600" />
              ) : (
                <span className="w-3 h-3 inline-block" />
              )}
              Contains number
            </li>
            <li className={`flex items-center gap-2 ${passwordRequirements.hasSpecialChar ? 'text-green-600' : ''}`}>
              {passwordRequirements.hasSpecialChar ? (
                <Check className="h-3 w-3 text-green-600" />
              ) : (
                <span className="w-3 h-3 inline-block" />
              )}
              Contains special character
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end pt-4">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="min-w-32"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Updating...
            </>
          ) : (
            <>
              <Key className="mr-2 h-4 w-4" />
              Change Password
            </>
          )}
        </Button>
      </div>
    </form>
  );
}