"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Edit, Eye, FileText, MoreHorizontal, Plus, Trash2, Users } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { useHeader } from "@/contexts/dashboard-context";
import {
  DataTable,
  DataTablePagination,
  DataTableSearch,
  useDataTableState,
} from "@/components/data-table";
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
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDeleteCourse, useLearningCoursesPage } from "@/lib/hooks/use-learning-courses";
import type { Course } from "@/types/learning.types";

export default function CourseManagementPage() {
  const router = useRouter();
  const { setHeader, clearHeader } = useHeader();
  const { state, setGlobalFilter, setPage, setPageSize } = useDataTableState();
  const search = state.globalFilter ?? "";

  // Search is server-side; the courses route has no sort param, so sorting is manual.
  const {
    data: pageData,
    isPending,
    isFetching,
    error,
    refetch,
  } = useLearningCoursesPage({
    search: search || undefined,
    page: state.page,
    limit: state.pageSize,
  });
  const courses = pageData?.courses ?? [];
  const totalPages = Math.max(1, pageData?.totalPages ?? 1);
  const totalStudents = courses.reduce((sum, course) => sum + course.students, 0);

  const deleteMutation = useDeleteCourse();
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
  const isDeletingCourse = deleteMutation.isPending;

  useEffect(() => {
    setHeader({
      title: "Course Management",
      description: "Create, edit, and manage your courses and curriculum.",
    });

    return () => {
      clearHeader();
    };
  }, [setHeader, clearHeader]);

  const confirmDeleteCourse = async () => {
    if (!courseToDelete) return;
    try {
      await deleteMutation.mutateAsync(courseToDelete.id);
      setCourseToDelete(null);
    } catch {
      // The hook already toasts the failure; keep the dialog open to retry.
    }
  };

  const columns: ColumnDef<Course>[] = [
    {
      accessorKey: "title",
      header: "Title",
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex flex-col font-medium">
          <span>{row.original.title}</span>
          <span className="text-xs font-normal text-muted-foreground">{row.original.category}</span>
        </div>
      ),
    },
    {
      id: "status",
      header: "Status",
      enableSorting: false,
      cell: () => (
        // Course records carry no status field today; the wire shape is always published.
        <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
          Published
        </Badge>
      ),
    },
    {
      accessorKey: "level",
      header: "Level",
      enableSorting: false,
    },
    {
      accessorKey: "students",
      header: () => <span className="block text-right">Students</span>,
      enableSorting: false,
      cell: ({ row }) => (
        <span className="block text-right">{row.original.students.toLocaleString()}</span>
      ),
    },
    {
      accessorKey: "rating",
      header: () => <span className="block text-right">Rating</span>,
      enableSorting: false,
      cell: ({ row }) => <span className="block text-right">{row.original.rating}</span>,
    },
    {
      id: "actions",
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => router.push(`/dashboard/learning/courses/${row.original.id}`)}
            >
              <Eye className="mr-2 h-4 w-4" /> View
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => router.push(`/dashboard/learning/admin/${row.original.id}/edit`)}
            >
              <Edit className="mr-2 h-4 w-4" /> Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => setCourseToDelete(row.original)}
            >
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-8 animate-fadeInUp">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <Button onClick={() => router.push("/dashboard/learning/admin/create")}>
          <Plus className="h-4 w-4 mr-2" />
          Create New Course
        </Button>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Courses
            </CardTitle>
            <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center">
              <FileText className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pageData?.total ?? courses.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Students (this page)
            </CardTitle>
            <div className="h-8 w-8 rounded-full bg-green-50 flex items-center justify-center">
              <Users className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStudents.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <DataTable
        columns={columns}
        data={courses}
        loading={isPending}
        error={error ? (error instanceof Error ? error.message : "Failed to load courses.") : null}
        onRetry={() => void refetch()}
        caption="Courses you manage"
        manualSorting
        getRowId={(course) => course.id}
        emptyTitle={search ? "No results found." : "No courses yet. Create your first course."}
        emptyDescription={
          search ? "Try a different search term." : "Use the Create New Course button to begin."
        }
        toolbar={
          <div className="flex items-center gap-2 py-4">
            <DataTableSearch
              value={search}
              onValueChange={setGlobalFilter}
              placeholder="Search courses..."
            />
          </div>
        }
        pagination={
          <DataTablePagination
            page={Math.min(state.page, totalPages)}
            pageCount={totalPages}
            total={pageData?.total ?? 0}
            pageSize={state.pageSize}
            loading={isFetching}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        }
      />

      <AlertDialog
        open={courseToDelete !== null}
        onOpenChange={(open) => {
          if (!open && !isDeletingCourse) setCourseToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{courseToDelete?.title}"?</AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingCourse}>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={isDeletingCourse || !courseToDelete}
              onClick={confirmDeleteCourse}
            >
              {isDeletingCourse ? "Deleting..." : "Delete course"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
