"use client";

import { useState, useRef } from "react";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

import { Camera, Upload, X, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

import { updateProfile } from "@/lib/client";

interface ProfilePhotoUploadProps {
  user: any;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export function ProfilePhotoUpload({ user }: ProfilePhotoUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(user.image || user.profilePhoto || null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const validateFile = (file: File): boolean => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Please upload a valid image file (JPEG, PNG, WebP, or GIF)");
      return false;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("File size must be less than 5MB");
      return false;
    }

    return true;
  };

  const handleFileSelect = (file: File) => {
    setError(null);
    setSuccess(false);

    if (!validateFile(file)) {
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Start upload
    uploadPhoto(file);
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const uploadPhoto = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate upload progress
      for (let i = 0; i <= 100; i += 10) {
        setUploadProgress(i);
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      // Create a temporary URL for the uploaded file
      const photoUrl = URL.createObjectURL(file);

      // Update profile with new photo URL
      const result = await updateProfile({
        image: photoUrl
      });

      if (result.success) {
        setSuccess(true);
        // Use the photoUrl we created earlier instead of trying to get it from result.data
        setPreview(photoUrl);

        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(result.message || "Failed to upload photo");
      }
    } catch (error: any) {
      setError(error.message || "Failed to upload photo");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleRemovePhoto = async () => {
    setSuccess(false);
    setError(null);
    setPreview(null);

    try {
      const result = await updateProfile({ image: undefined });

      if (result.success) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(result.message || "Failed to remove photo");
      }
    } catch (error: any) {
      setError(error.message || "Failed to remove photo");
    }
  };

  return (
    <div className="space-y-4">
      {/* Success Message */}
      {success && (
        <Alert className="border-green-200 bg-green-50 text-green-800">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Profile photo updated successfully!
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

      {/* Current Photo Preview */}
      <div className="flex flex-col items-center space-y-4">
        <div className="relative">
          <Avatar className="h-24 w-24">
            <AvatarImage src={preview || undefined} alt="Profile" />
            <AvatarFallback className="text-lg font-medium">
              {user.name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>

          {/* Upload Badge */}
          {preview && (
            <Badge className="absolute -bottom-2 -right-2 bg-green-500">
              <CheckCircle className="h-3 w-3" />
            </Badge>
          )}
        </div>

        <div className="text-center">
          <p className="text-sm font-medium">
            {preview ? "Current Photo" : "No Photo"}
          </p>
          <p className="text-xs text-muted-foreground">
            {preview ? "Click below to change" : "Upload a photo to personalize your profile"}
          </p>
        </div>
      </div>

      {/* Upload Progress */}
      {isUploading && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Uploading...</span>
            <span>{uploadProgress}%</span>
          </div>
          <Progress value={uploadProgress} className="h-2" />
        </div>
      )}

      {/* Upload Area */}
      <Card
        className={`border-2 border-dashed transition-colors cursor-pointer ${
          isDragging
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-muted-foreground/50"
        } ${isUploading ? "pointer-events-none opacity-50" : ""}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
      >
        <CardContent className="p-6 text-center">
          <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-4" />
          <div className="space-y-2">
            <p className="text-sm font-medium">
              {isDragging ? "Drop your photo here" : "Click to upload or drag and drop"}
            </p>
            <p className="text-xs text-muted-foreground">
              JPEG, PNG, WebP, or GIF (MAX. 5MB)
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept={ALLOWED_TYPES.join(",")}
            onChange={handleFileInputChange}
            disabled={isUploading}
            className="hidden"
          />
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="flex-1"
          variant="outline"
        >
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Camera className="mr-2 h-4 w-4" />
              Choose Photo
            </>
          )}
        </Button>

        {preview && (
          <Button
            onClick={handleRemovePhoto}
            disabled={isUploading}
            variant="outline"
            className="text-red-600 hover:text-red-700 hover:border-red-200"
          >
            <X className="mr-2 h-4 w-4" />
            Remove
          </Button>
        )}
      </div>

      {/* Photo Guidelines */}
      <Card className="bg-muted/30">
        <CardContent className="p-4">
          <h4 className="font-medium text-sm mb-2">Photo Guidelines:</h4>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Use a recent, clear photo of yourself</li>
            <li>• Square images work best (recommended: 400x400px)</li>
            <li>• Maximum file size: 5MB</li>
            <li>• Accepted formats: JPEG, PNG, WebP, GIF</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}