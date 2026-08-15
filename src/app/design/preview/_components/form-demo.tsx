"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";

import {
  CheckboxField,
  FormActions,
  FormSection,
  FormSheet,
  SelectField,
  TextareaField,
  TextField,
} from "@/components/dashboard/form-sheet";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";

// Demo-only schema: design preview is outside the src/lib/validation
// ratchet, real forms import their schema from the domain validation file.
const memberFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.email("Enter a valid email address"),
  role: z.enum(["member", "moderator", "staff", "admin"], { error: "Select a role" }),
  chapter: z.string().min(1, "Pick a chapter"),
  bio: z.string().max(240, "Bio must be at most 240 characters").optional(),
  updates: z.boolean(),
});

type MemberFormValues = z.infer<typeof memberFormSchema>;

const ROLE_OPTIONS = [
  { value: "member", label: "Member" },
  { value: "moderator", label: "Moderator" },
  { value: "staff", label: "Staff" },
  { value: "admin", label: "Admin" },
];

const CHAPTER_OPTIONS = ["Jakarta", "Bandung", "Surabaya", "Yogyakarta", "Denpasar"].map(
  (chapter) => ({ value: chapter, label: chapter }),
);

const FORM_ID = "design-preview-member-form";

export function FormDemo() {
  const [open, setOpen] = useState(false);
  const form = useForm<MemberFormValues>({
    resolver: zodResolver(memberFormSchema),
    defaultValues: {
      name: "",
      email: "",
      chapter: "",
      bio: "",
      updates: true,
    },
  });

  const onSubmit = async (values: MemberFormValues) => {
    // Real forms call a server action or API route here; the demo only reports.
    const { promise, resolve } = Promise.withResolvers<void>();
    setTimeout(resolve, 600);
    await promise;
    toast.success(`Saved ${values.name} (${values.role})`, {
      description: "Demo submit, nothing was persisted.",
    });
    setOpen(false);
    form.reset();
  };

  const { isDirty, isSubmitting } = form.formState;

  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle>Add member</CardTitle>
        <CardDescription>
          The dashboard CRUD standard: field shorthands grouped in sections inside a FormSheet. Open
          it, submit while empty to see inline validation, then close after typing to see the
          unsaved-changes guard.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={() => setOpen(true)}>Open form sheet</Button>
      </CardContent>

      <FormSheet
        open={open}
        onOpenChange={setOpen}
        title="Add member"
        description="Demo of the standard dashboard form container."
        isDirty={isDirty && !isSubmitting}
        footer={
          <FormActions
            formId={FORM_ID}
            mode="create"
            submitting={isSubmitting}
            onCancel={() => setOpen(false)}
            entityLabel="Member"
          />
        }
      >
        <Form {...form}>
          <form
            id={FORM_ID}
            onSubmit={form.handleSubmit(onSubmit)}
            noValidate
            className="space-y-6 p-6"
          >
            <FormSection title="Identity">
              <TextField
                name="name"
                label="Full name"
                required
                placeholder="Dewi Kusuma"
                autoComplete="name"
              />
              <TextField
                name="email"
                label="Email"
                required
                type="email"
                placeholder="dewi.kusuma@example.org"
                autoComplete="email"
              />
            </FormSection>

            <FormSection title="Membership">
              <SelectField name="role" label="Role" required options={ROLE_OPTIONS} />
              <SelectField name="chapter" label="Chapter" required options={CHAPTER_OPTIONS} />
            </FormSection>

            <FormSection title="Profile">
              <TextareaField
                name="bio"
                label="Bio (optional)"
                rows={3}
                description="At most 240 characters."
                placeholder="Short public biography, shown only when the profile is public (D7)."
              />
              <CheckboxField
                name="updates"
                label="Send announcement emails"
                description="Announcements published by the content module (D11)."
              />
            </FormSection>
          </form>
        </Form>
      </FormSheet>
    </Card>
  );
}
