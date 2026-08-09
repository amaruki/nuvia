/**
 * Change-password island for settings/security. Posts to the real
 * /api/v1/auth/change-password route, which revokes every other session
 * on success (revokeOtherSessions in the route). Errors surface through
 * FormMessage (client validation) and sonner toasts (server problems,
 * RFC 9457 detail).
 */

"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { apiFetch, ApiClientError } from "@/lib/api-client";
import {
  changePasswordSchema,
  type ChangePasswordFormData,
} from "@/lib/validation/auth.validation";

const FIELDS = [
  { name: "currentPassword", label: "Current password" },
  { name: "newPassword", label: "New password" },
  { name: "confirmPassword", label: "Confirm new password" },
] as const;

export function ChangePasswordForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  async function onSubmit(data: ChangePasswordFormData) {
    setIsSubmitting(true);
    try {
      await apiFetch<null>("/api/v1/auth/change-password", {
        method: "POST",
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        }),
      });
      form.reset();
      toast.success("Password changed", {
        description: "You were signed out of your other devices.",
      });
    } catch (error) {
      const message =
        error instanceof ApiClientError ? error.message : "Could not change your password.";
      toast.error("Password change failed", { description: message });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-4">
        {FIELDS.map((field) => (
          <FormField
            key={field.name}
            control={form.control}
            name={field.name}
            render={({ field: controlField }) => (
              <FormItem>
                <FormLabel>{field.label}</FormLabel>
                <FormControl>
                  <Input type="password" autoComplete="current-password" {...controlField} />
                </FormControl>
                {field.name === "newPassword" && (
                  <FormDescription>
                    At least 8 characters with upper- and lowercase letters, a number, and a special
                    character.
                  </FormDescription>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
        ))}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Change password
        </Button>
      </form>
    </Form>
  );
}
