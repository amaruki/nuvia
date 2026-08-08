"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { Upload, X, Save } from "lucide-react";
import { useHeader } from "@/contexts/dashboard-context";

export default function InstructorSettingsPage() {
  const { setHeader, clearHeader } = useHeader();

  useEffect(() => {
    setHeader({
      title: "Instructor Settings",
      description: "Manage your instructor profile and certificate settings.",
    });

    return () => {
      clearHeader();
    };
  }, [setHeader, clearHeader]);
  const [signature, setSignature] = useState<string | null>(
    "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Signature_sample.svg/1200px-Signature_sample.svg.png",
  );
  const [isUploading, setIsUploading] = useState(false);

  // Mock upload handlers
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      // Simulate network request
      setTimeout(() => {
        // Create a fake object URL for preview
        const objectUrl = URL.createObjectURL(file);
        setSignature(objectUrl);
        setIsUploading(false);
        toast.success("Signature uploaded successfully");
      }, 1500);
    }
  };

  const handleRemoveSignature = () => {
    setSignature(null);
    toast.info("Signature removed");
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Profile settings saved successfully");
  };

  return (
    <div className="container max-w-4xl mx-auto p-6 space-y-8 animate-fadeIn">
      <div className="grid gap-8 md:grid-cols-[1fr_250px]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Digital Signature</CardTitle>
              <CardDescription>
                Upload your signature to be automatically applied to certificates issued for your
                courses.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg bg-muted/50 transition-colors hover:bg-muted/80">
                {signature ? (
                  <div className="relative w-full max-w-sm aspect-[3/1] bg-card rounded-md shadow-sm border p-4 flex items-center justify-center">
                    <div className="relative w-full h-full">
                      <Image
                        src={signature}
                        alt="Signature Preview"
                        fill
                        className="object-contain"
                      />
                    </div>
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full shadow-md"
                      onClick={handleRemoveSignature}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="text-center space-y-2">
                    <div className="flex justify-center">
                      <Upload className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div className="text-sm font-medium">Click to upload or drag and drop</div>
                    <p className="text-xs text-muted-foreground">
                      PNG or transparent JPG (max 2MB)
                    </p>
                  </div>
                )}

                {/* Hidden input for file upload */}
                {!signature && (
                  <Input
                    type="file"
                    accept="image/png, image/jpeg"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={handleFileUpload}
                    disabled={isUploading}
                  />
                )}
              </div>

              <div className="bg-primary/10 border border-primary/20 rounded-md p-4 text-sm text-foreground">
                <p className="font-semibold mb-1">Recommended Specifications</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Transparent PNG format</li>
                  <li>Ratio of 3:1 (e.g., 600x200 pixels)</li>
                  <li>Dark ink color (black or dark blue) for best visibility</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Public Profile</CardTitle>
              <CardDescription>
                This information will be displayed on your course landing pages.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form id="profile-form" onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Professional Title</Label>
                  <Input id="title" defaultValue="Senior Frontend Engineer" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="bio">Bio</Label>
                  <textarea
                    className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    id="bio"
                    defaultValue="Sarah is a Core Team member of Vue.js and a Staff Writer at CSS-Tricks. She loves teaching and building tools for developers."
                  />
                </div>
              </form>
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
              <Button type="submit" form="profile-form">
                <Save className="mr-2 h-4 w-4" /> Save Changes
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Sidebar / quick info */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Certificate Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-[4/3] bg-card border shadow-sm rounded-sm p-3 flex flex-col items-center justify-between text-[6px] text-center mb-2">
                <div className="font-serif text-[8px] text-primary pt-2">
                  Certificate of Completion
                </div>
                <div>Awarded to Student</div>
                <div className="w-full flex justify-between items-end px-1 pb-1">
                  <div className="w-8 border-t border-border pt-0.5">Date</div>
                  <div className="w-12 border-t border-border pt-0.5 relative">
                    {signature && (
                      <div className="absolute -top-3 left-0 w-full h-4">
                        <Image src={signature} alt="Sig" fill className="object-contain" />
                      </div>
                    )}
                    Signature
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                This is how your signature will appear on student certificates.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
