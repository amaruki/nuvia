"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

import { Key, CheckCircle, AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react";

import { changePassword } from "@/lib/client";
import {
  changePasswordSchema,
  type ChangePasswordFormData,
} from "@/lib/validation/auth.validation";

import { PasswordRequirementsCard } from "./password-requirements-card";
import {
  checkPasswordRequirements,
  getProgressBarColor,
  getStrengthColor,
  getStrengthText,
} from "./password-strength";
import type { SecurityFormProps } from "./types";

// `_props`: the profile page passes the session user, but the password change
// authenticates through the session cookie via changePassword() — see
// SecurityFormProps.
export function SecurityForm(_props: SecurityFormProps) {
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
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const newPassword = watch("newPassword");

  const passwordRequirements = checkPasswordRequirements(newPassword || "");

  const onSubmit = async (data: ChangePasswordFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
        revokeOtherSessions: true,
      });

      if (result.data?.user) {
        setIsSuccess(true);
        // Reset form
        handleSubmit(() => {})();
        setTimeout(() => setIsSuccess(false), 3000);
      } else {
        setError(result.error?.message || "Failed to change password");
      }
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : "An unexpected error occurred");
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
          <AlertDescription>Password changed successfully!</AlertDescription>
        </Alert>
      )}

      {/* Error Message */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
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
        {errors.newPassword && <p className="text-sm text-red-600">{errors.newPassword.message}</p>}

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
      <PasswordRequirementsCard requirements={passwordRequirements} />

      {/* Submit Button */}
      <div className="flex justify-end pt-4">
        <Button type="submit" disabled={isSubmitting} className="min-w-32">
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
