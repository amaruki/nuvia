"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Laptop, Loader2, LogOut, ShieldCheck, Smartphone, Tablet } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useHeader } from "@/contexts/dashboard-context";
import { useSession } from "@/lib/client";
import { logger } from "@/lib/logger";
import { formatDate } from "@/lib/utils/date-utils";
import type { ApiEnvelope } from "@/lib/api-client";

interface ActiveDevice {
  token: string;
  deviceName: string;
  deviceType: string;
  ipAddress: string;
  location: string;
  lastActiveAt: string;
}

const ACTIVE_DEVICES_QUERY_KEY = ["activeDevices"] as const;

function deviceIcon(deviceType: string) {
  if (deviceType.toLowerCase().includes("mobile")) {
    return <Smartphone className="h-5 w-5" />;
  }
  if (deviceType.toLowerCase().includes("tablet")) {
    return <Tablet className="h-5 w-5" />;
  }
  return <Laptop className="h-5 w-5" />;
}

export default function ActiveDevicesPage() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const currentToken = session?.session?.token;

  const { data, isPending, error, refetch } = useQuery({
    queryKey: ACTIVE_DEVICES_QUERY_KEY,
    queryFn: async () => {
      const response = await fetch("/api/v1/auth/active-devices");
      const body: ApiEnvelope<ActiveDevice[]> = await response.json();
      if (!response.ok) {
        throw new Error("Failed to load active devices");
      }
      return body.data;
    },
  });

  const devices = data ?? [];

  const invalidateDevices = () => {
    void queryClient.invalidateQueries({ queryKey: ACTIVE_DEVICES_QUERY_KEY });
  };

  const revokeDevice = useMutation({
    mutationFn: async (token: string) => {
      const response = await fetch(
        `/api/v1/auth/active-devices?token=${encodeURIComponent(token)}`,
        {
          method: "DELETE",
        },
      );
      if (!response.ok) {
        throw new Error("Failed to sign out this session.");
      }
    },
    onSuccess: invalidateDevices,
    onError: (err) => logger.error("Failed to revoke session", err),
  });

  const [revokingOthers, setRevokingOthers] = useState(false);
  const revokeOtherDevices = async () => {
    const others = devices.filter((device) => device.token !== currentToken);
    if (others.length === 0) return;
    setRevokingOthers(true);
    try {
      await Promise.all(
        others.map((device) =>
          fetch(`/api/v1/auth/active-devices?token=${encodeURIComponent(device.token)}`, {
            method: "DELETE",
          }).then((response) => {
            if (!response.ok) throw new Error("Failed to revoke a session.");
          }),
        ),
      );
      invalidateDevices();
    } catch (err) {
      logger.error("Failed to revoke all other sessions", err);
    } finally {
      setRevokingOthers(false);
    }
  };

  const hasOtherDevices = devices.some((device) => device.token !== currentToken);

  const { setHeader, clearHeader } = useHeader();

  useEffect(() => {
    setHeader({
      title: "Active Devices",
      description: "Manage the devices currently signed in to your account.",
    });
    return () => {
      clearHeader();
    };
  }, [setHeader, clearHeader]);

  const columns: ColumnDef<ActiveDevice>[] = [
    {
      id: "device",
      accessorFn: (row) => row.deviceName,
      header: "Device",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
            {deviceIcon(row.original.deviceType)}
          </span>
          <div>
            <div className="flex items-center gap-2 font-medium">
              {row.original.deviceName}
              {row.original.token === currentToken && (
                <Badge variant="secondary" className="gap-1">
                  <ShieldCheck className="h-3 w-3" />
                  This device
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {row.original.deviceType} • {row.original.location} • {row.original.ipAddress}
            </p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "lastActiveAt",
      header: "Last Active",
      cell: ({ row }) => (
        <div className="text-sm">
          <div>{formatDistanceToNow(new Date(row.original.lastActiveAt))} ago</div>
          <div className="text-muted-foreground">
            {formatDate(row.original.lastActiveAt, "MMM d, yyyy h:mm a")}
          </div>
        </div>
      ),
    },
    {
      id: "actions",
      header: () => <span className="block text-right">Actions</span>,
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => {
        const isCurrent = row.original.token === currentToken;
        return (
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              disabled={isCurrent || revokeDevice.isPending}
              aria-label={
                isCurrent
                  ? "Current device cannot be signed out"
                  : `Sign out ${row.original.deviceName}`
              }
              className="text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20 gap-2"
              onClick={() => revokeDevice.mutate(row.original.token)}
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button
          variant="outline"
          disabled={!hasOtherDevices || revokingOthers || revokeDevice.isPending}
          onClick={() => void revokeOtherDevices()}
          className="gap-2"
        >
          {revokingOthers ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <LogOut className="h-4 w-4" />
          )}
          Sign out all other devices
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={devices}
        loading={isPending}
        error={error ? (error instanceof Error ? error.message : "Failed to load devices.") : null}
        onRetry={() => void refetch()}
        caption="Sessions currently signed in to your account"
        getRowId={(device) => device.token}
        emptyTitle="No active devices"
        emptyDescription="Devices signed in to your account will appear here."
      />
    </div>
  );
}
