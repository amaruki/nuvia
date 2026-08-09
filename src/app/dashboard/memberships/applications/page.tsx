"use client";

/**
 * Membership application queue (UI-33, decision D10).
 *
 * Real backoffice view over GET/PATCH /api/v1/membership-applications —
 * replaces the old stub. Reviewers approve or reject pending applications;
 * approval records the decision only (the membership itself activates once
 * the offline payment is booked through the subscription backoffice).
 */

import { useCallback, useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { AlertTriangle, CheckCircle2, Inbox, RefreshCw, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useHeader } from "@/contexts/dashboard-context";
import { ApiClientError, apiFetch } from "@/lib/api-client";
import { ReviewDialog } from "./_components/review-dialog";

type ApplicationStatus = "PENDING" | "APPROVED" | "REJECTED";

interface ApplicationRow {
  id: string;
  userId: string | null;
  name: string;
  email: string;
  organization: string | null;
  tierId: string | null;
  tierName: string | null;
  applicantUsername: string | null;
  message: string | null;
  status: ApplicationStatus;
  reviewedBy: string | null;
  reviewedAt: string | null;
  reviewNote: string | null;
  createdAt: string;
}

interface ListMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const STATUS_BADGE: Record<ApplicationStatus, { label: string; className: string }> = {
  PENDING: { label: "Pending", className: "bg-warning/15 text-warning" },
  APPROVED: { label: "Approved", className: "bg-success/15 text-success" },
  REJECTED: { label: "Rejected", className: "bg-destructive/15 text-destructive" },
};

export default function MembershipApplications() {
  const { setHeader, clearHeader } = useHeader();

  const [statusFilter, setStatusFilter] = useState<"PENDING" | "ALL">("PENDING");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<ApplicationRow[]>([]);
  const [meta, setMeta] = useState<ListMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reviewTarget, setReviewTarget] = useState<ApplicationRow | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      const envelope = await apiFetch<ApplicationRow[]>(
        `/api/v1/membership-applications?${params.toString()}`,
      );
      setItems(envelope.data);
      setMeta(
        envelope.meta
          ? {
              page: envelope.meta.page ?? page,
              limit: envelope.meta.limit ?? 20,
              total: envelope.meta.total ?? envelope.data.length,
              totalPages: envelope.meta.totalPages ?? 1,
            }
          : null,
      );
    } catch (error) {
      setLoadError(error instanceof ApiClientError ? error.message : "Failed to load applications");
    } finally {
      setIsLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    setHeader({
      title: "Membership Applications",
      description: "Review join applications submitted through the membership funnel",
    });
    return () => clearHeader();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setHeader, clearHeader]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleReviewed = () => {
    setReviewTarget(null);
    void load();
  };

  const handleReviewError = (message: string) => {
    toast.error(message);
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <Select
          value={statusFilter}
          onValueChange={(value) => {
            setStatusFilter(value as "PENDING" | "ALL");
            setPage(1);
          }}
        >
          <SelectTrigger aria-label="Filter applications by status" className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PENDING">Pending review</SelectItem>
            <SelectItem value="ALL">All applications</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" size="sm" onClick={() => void load()} disabled={isLoading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {loadError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Loading applications…</div>
          ) : items.length === 0 ? (
            <div className="text-center py-12">
              <Inbox className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="font-medium">No applications here</p>
              <p className="text-sm text-muted-foreground">
                {statusFilter === "PENDING"
                  ? "New join applications will appear here for review."
                  : "No applications have been submitted yet."}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Applicant</TableHead>
                  <TableHead>Organization</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((row) => {
                  const badge = STATUS_BADGE[row.status];
                  return (
                    <TableRow key={row.id}>
                      <TableCell>
                        <div className="font-medium">{row.name}</div>
                        <div className="text-xs text-muted-foreground">{row.email}</div>
                        {row.applicantUsername && (
                          <div className="text-xs text-muted-foreground">
                            account: {row.applicantUsername}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {row.organization ?? "—"}
                      </TableCell>
                      <TableCell>{row.tierName ?? "—"}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDistanceToNow(new Date(row.createdAt), { addSuffix: true })}
                      </TableCell>
                      <TableCell>
                        <Badge className={badge.className}>{badge.label}</Badge>
                        {row.reviewNote && (
                          <div className="text-xs text-muted-foreground mt-1 max-w-56 truncate">
                            {row.reviewNote}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {row.status === "PENDING" ? (
                          <Button size="sm" variant="outline" onClick={() => setReviewTarget(row)}>
                            Review
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {row.status === "APPROVED" ? (
                              <CheckCircle2 className="h-4 w-4 inline text-green-600" />
                            ) : (
                              <XCircle className="h-4 w-4 inline text-red-600" />
                            )}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {meta.page} of {meta.totalPages} · {meta.total} application
            {meta.total === 1 ? "" : "s"}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= meta.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <ReviewDialog
        application={reviewTarget}
        onClose={() => setReviewTarget(null)}
        onReviewed={handleReviewed}
        onError={handleReviewError}
      />
    </div>
  );
}
