"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useHeader } from "@/contexts/dashboard-context";
import { Download, Eye, Ban, Search, Filter, Award, ShieldCheck, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLearningCertificates } from "@/lib/hooks/use-learning-certificates";
import { MoreHorizontal } from "lucide-react";

export default function AdminCertificationsPage() {
  const [searchTerm, setSearchTerm] = React.useState("");
  const { setHeader, clearHeader } = useHeader();
  const { certificates, loading, error, revokeCertificate } = useLearningCertificates();
  const [certificateToRevoke, setCertificateToRevoke] = React.useState<string | null>(null);
  const [isRevokingCertificate, setIsRevokingCertificate] = React.useState(false);

  useEffect(() => {
    setHeader({
      title: "Certification Management",
      description: "Monitor and manage issued certificates across platform.",
    });

    return () => {
      clearHeader();
    };
  }, [setHeader, clearHeader]);

  const filteredCertificates = certificates.filter(
    (cert) =>
      cert.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.verificationCode.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleRevoke = (id: string) => {
    setCertificateToRevoke(id);
  };

  const confirmRevokeCertificate = async () => {
    if (!certificateToRevoke) return;
    try {
      setIsRevokingCertificate(true);
      await revokeCertificate(certificateToRevoke);
      setCertificateToRevoke(null);
    } catch {
      // The hook already toasts the failure; keep the dialog open to retry.
    } finally {
      setIsRevokingCertificate(false);
    }
  };

  const totalCertificates = certificates.length;
  const activeCertificates = certificates.filter((c) => c.status === "active").length;
  const revokedCertificates = certificates.filter((c) => c.status === "revoked").length;

  return (
    <div className="p-6 space-y-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Issued
            </CardTitle>
            <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center">
              <Award className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCertificates}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Certificates
            </CardTitle>
            <div className="h-8 w-8 rounded-full bg-green-50 flex items-center justify-center">
              <ShieldCheck className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCertificates}</div>
            <p className="text-xs text-muted-foreground">Currently valid</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Revoked</CardTitle>
            <div className="h-8 w-8 rounded-full bg-red-50 flex items-center justify-center">
              <XCircle className="h-4 w-4 text-red-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{revokedCertificates}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 bg-card p-4 rounded-lg border shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search student, course, or verification ID..."
            className="pl-8 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" className="w-full sm:w-auto">
            <Filter className="mr-2 h-4 w-4" /> Filter
          </Button>
        </div>
      </div>

      <div className="border rounded-lg bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[180px]">Verification ID</TableHead>
              <TableHead>Student</TableHead>
              <TableHead>Course</TableHead>
              <TableHead>Issue Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  Loading certificates…
                </TableCell>
              </TableRow>
            )}
            {error && (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-destructive">
                  {error}
                </TableCell>
              </TableRow>
            )}
            {!loading &&
              !error &&
              (filteredCertificates.length > 0 ? (
                filteredCertificates.map((cert) => (
                  <TableRow key={cert.id} className="hover:bg-muted/5">
                    <TableCell className="font-mono text-xs font-medium text-primary">
                      {cert.verificationCode}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">{cert.studentName}</span>
                        <span className="text-xs text-muted-foreground">{cert.studentEmail}</span>
                      </div>
                    </TableCell>
                    <TableCell
                      className="max-w-[200px] truncate font-medium text-sm"
                      title={cert.courseName}
                    >
                      {cert.courseName}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {cert.issueDate}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`${
                          cert.status === "active"
                            ? "bg-green-500/10 text-green-600 border-green-500/20"
                            : "bg-destructive/10 text-destructive border-destructive/20"
                        } transition-colors`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full mr-2 ${cert.status === "active" ? "bg-green-600" : "bg-destructive"}`}
                        />
                        {cert.status === "active" ? "Active" : "Revoked"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/dashboard/learning/certifications/${cert.id}`}
                              target="_blank"
                              className="cursor-pointer"
                            >
                              <Eye className="mr-2 h-4 w-4" /> View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive cursor-pointer"
                            onClick={() => handleRevoke(cert.id)}
                          >
                            <Ban className="mr-2 h-4 w-4" /> Revoke Certificate
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Search className="h-8 w-8 opacity-20" />
                      <p>No certificates found matching your criteria.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-end space-x-2 text-sm text-muted-foreground">
        <div className="flex-1 text-xs">
          Showing <strong>{filteredCertificates.length}</strong> of{" "}
          <strong>{certificates.length}</strong> results
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled>
            Previous
          </Button>
          <Button variant="outline" size="sm" disabled>
            Next
          </Button>
        </div>
      </div>

      <AlertDialog
        open={certificateToRevoke !== null}
        onOpenChange={(open) => {
          if (!open && !isRevokingCertificate) setCertificateToRevoke(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke this certificate?</AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRevokingCertificate}>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={isRevokingCertificate || !certificateToRevoke}
              onClick={confirmRevokeCertificate}
            >
              {isRevokingCertificate ? "Revoking..." : "Revoke certificate"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
