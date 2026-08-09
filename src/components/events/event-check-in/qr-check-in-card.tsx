"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { QrCode, UserCheck } from "lucide-react";
import type { EventCheckInInput } from "@/lib/validation/event.validation";
import { checkInFormSchema, type CheckInFormInput } from "./types";

interface QrCheckInCardProps {
  eventId: string;
  onCheckIn: (data: EventCheckInInput) => void;
  isSubmitting: boolean;
}

export function QrCheckInCard({ eventId, onCheckIn, isSubmitting }: QrCheckInCardProps) {
  const [checkInMethod, setCheckInMethod] = React.useState<"qr" | "manual">("qr");

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CheckInFormInput>({
    resolver: zodResolver(checkInFormSchema),
  });

  const onFormSubmit = (data: CheckInFormInput) => {
    const checkInData: EventCheckInInput = {
      eventId,
      checkInMethod,
      verificationCode: data.verificationCode,
    };
    onCheckIn(checkInData);
    reset();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <QrCode className="h-5 w-5 mr-2" />
          QR Code Check-in
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center">
          <div className="bg-muted border-2 border-dashed border-border rounded-lg p-8 mb-4">
            <QrCode className="h-16 w-16 mx-auto text-foreground/40" />
            <p className="mt-2 text-sm text-foreground/50">Scan QR codes from event tickets</p>
          </div>
          <p className="text-sm text-foreground/60">
            Attendees can show their QR code in the event confirmation email or in their event
            registration.
          </p>
        </div>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="verificationCode">Verification Code</Label>
            <Input
              id="verificationCode"
              {...register("verificationCode")}
              placeholder="Enter verification code from QR"
              className="mt-1"
            />
            {errors.verificationCode && (
              <p className="mt-1 text-sm text-destructive">{errors.verificationCode.message}</p>
            )}
          </div>

          <div className="flex space-x-2">
            <Button
              type="button"
              variant={checkInMethod === "qr" ? "default" : "outline"}
              onClick={() => setCheckInMethod("qr")}
              className="flex-1"
            >
              <QrCode className="h-4 w-4 mr-2" />
              QR Code
            </Button>
            <Button
              type="button"
              variant={checkInMethod === "manual" ? "default" : "outline"}
              onClick={() => setCheckInMethod("manual")}
              className="flex-1"
            >
              <UserCheck className="h-4 w-4 mr-2" />
              Manual
            </Button>
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Checking in..." : "Check In Attendee"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
