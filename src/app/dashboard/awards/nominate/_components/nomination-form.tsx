"use client";

/**
 * Member nomination form (backlog UI-36).
 *
 * Posts to the caller's own ring-1 endpoint; the nominator identity is
 * forced from the session server-side, so the form never carries it.
 * Non-201 responses surface the service's exact reason (closed program,
 * window over, duplicate nomination) instead of a generic failure.
 */

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { OpenAwardProgram } from "@/lib/services/award";
import { formatDate } from "@/lib/utils/date-utils";

interface NominationFormProps {
  programs: OpenAwardProgram[];
}

export function NominationForm({ programs }: NominationFormProps) {
  const router = useRouter();
  const [programId, setProgramId] = useState(programs[0]?.id ?? "");
  const [nomineeName, setNomineeName] = useState("");
  const [nomineeEmail, setNomineeEmail] = useState("");
  const [statement, setStatement] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedNominee, setSubmittedNominee] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!programId) {
      setError("Select an award program first.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const body: Record<string, unknown> = {
        programId,
        nomineeName: nomineeName.trim(),
        nomineeEmail: nomineeEmail.trim(),
      };
      if (statement.trim()) body.statement = statement.trim();

      const res = await fetch("/api/v1/awards/nominations/mine", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const problem = (await res.json().catch(() => null)) as {
          detail?: string;
          title?: string;
        } | null;
        setError(problem?.detail ?? problem?.title ?? "Failed to submit your nomination.");
        return;
      }

      setSubmittedNominee(nomineeName.trim());
      setNomineeName("");
      setNomineeEmail("");
      setStatement("");
      // Refresh the server-rendered "Your nominations" list.
      router.refresh();
    } catch {
      setError("Something went wrong while submitting your nomination. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nominate a member</CardTitle>
        <CardDescription>
          Nominations start pending and are reviewed by the awards committee. You can submit one
          nomination per member per program.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {submittedNominee && (
            <Alert>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription>
                Nomination for {submittedNominee} submitted. The awards committee will review it.
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="program">Award program</Label>
            <Select value={programId} onValueChange={setProgramId}>
              <SelectTrigger id="program" className="w-full">
                <SelectValue placeholder="Select an open award program" />
              </SelectTrigger>
              <SelectContent>
                {programs.map((program) => (
                  <SelectItem key={program.id} value={program.id}>
                    {program.name}
                    {program.closeDate
                      ? ` — closes ${formatDate(program.closeDate, "MMM d, yyyy")}`
                      : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nomineeName">Nominee name</Label>
            <Input
              id="nomineeName"
              value={nomineeName}
              onChange={(event) => setNomineeName(event.target.value)}
              placeholder="Who deserves this award?"
              required
              minLength={2}
              maxLength={120}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="nomineeEmail">Nominee email</Label>
            <Input
              id="nomineeEmail"
              type="email"
              value={nomineeEmail}
              onChange={(event) => setNomineeEmail(event.target.value)}
              placeholder="nominee@example.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="statement">Why this nominee? (optional)</Label>
            <Textarea
              id="statement"
              value={statement}
              onChange={(event) => setStatement(event.target.value)}
              placeholder="A short statement supporting the nomination."
              rows={4}
            />
          </div>

          <Button type="submit" size="lg" disabled={submitting}>
            {submitting ? "Submitting…" : "Submit nomination"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
