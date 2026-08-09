/**
 * Account deletion island for settings/security. Wraps the real
 * DELETE /api/v1/auth/delete-account route (better-auth deleteUser with
 * the deployment's last-superadmin lockout guard). The password is always
 * required here even though better-auth would also accept a fresh session
 * — deleting an account deserves the strongest confirmation we have.
 */

"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, TriangleAlert } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { apiFetch, ApiClientError } from "@/lib/api-client";
import { deleteAccountSchema, type DeleteAccountFormData } from "@/lib/validation/auth.validation";

interface DeleteAccountDialogProps {
  /** Session user's email — shown so the user knows exactly which account goes away. */
  email: string;
}

export function DeleteAccountDialog({ email }: DeleteAccountDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<DeleteAccountFormData>({
    resolver: zodResolver(deleteAccountSchema),
    defaultValues: { password: "" },
  });

  async function onSubmit(data: DeleteAccountFormData) {
    setIsSubmitting(true);
    try {
      await apiFetch<null>("/api/v1/auth/delete-account", {
        method: "DELETE",
        body: JSON.stringify({ password: data.password }),
      });
      toast.success("Account deleted");
      // The session cookie is gone; leave the dashboard for the public site.
      window.location.assign("/");
    } catch (error) {
      const message =
        error instanceof ApiClientError ? error.message : "Could not delete your account.";
      toast.error("Account deletion failed", { description: message });
      setIsSubmitting(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">Delete account</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete your account?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently deletes <span className="font-medium">{email}</span> — profile,
            sessions, login history, and linked sign-in methods. There is no undo.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-4">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm with your password</FormLabel>
                  <FormControl>
                    <Input type="password" autoComplete="current-password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <AlertDialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="destructive" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <TriangleAlert className="h-4 w-4" />
                )}
                Delete account permanently
              </Button>
            </AlertDialogFooter>
          </form>
        </Form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
