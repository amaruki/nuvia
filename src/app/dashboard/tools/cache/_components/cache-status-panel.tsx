import { Database, Radio, Timer, Zap } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { CacheSystemStatus } from "@/lib/services/system-cache.service";

/**
 * Renders the status produced by getCacheSystemStatus(). Pure presentation —
 * every fact arrives already probed; this component invents nothing and
 * labels every degraded state (e.g. "not connected in this process")
 * instead of hiding it behind a green dot.
 */
export function CacheStatusPanel({ status }: { status: CacheSystemStatus }) {
  const { sessionCache, redis, rateLimiter, checkedAt } = status;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Zap className="size-4 text-muted-foreground" aria-hidden="true" />
            Session cache
          </CardTitle>
          <CardDescription>
            Gate from src/lib/session-cache/cache-ops.ts: ENABLE_REDIS_CACHE=true AND REDIS_URL set.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Status</span>
            <Badge variant={sessionCache.enabled ? "success" : "secondary"}>
              {sessionCache.enabled ? "Enabled" : "Disabled"}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">ENABLE_REDIS_CACHE flag</span>
            <span className="font-mono text-xs">
              {sessionCache.enableFlagSet ? "true" : "false"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">REDIS_URL</span>
            <span className="font-mono text-xs">
              {sessionCache.redisUrlConfigured ? "set" : "not set"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Entry TTL</span>
            <span className="font-mono text-xs">{sessionCache.ttlSeconds}s</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Key prefix</span>
            <span className="font-mono text-xs">{sessionCache.keyPrefix}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">In-process client</span>
            <span className="text-right text-xs">
              {sessionCache.clientConnectedInProcess
                ? "Connected in this process"
                : "Not connected in this process yet (connects on first cached session)"}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Radio className="size-4 text-muted-foreground" aria-hidden="true" />
            Redis reachability
          </CardTitle>
          <CardDescription>One PING round-trip when this page loaded.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Configured</span>
            <span className="font-mono text-xs">{redis.configured ? "yes" : "no"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Probe result</span>
            <Badge variant={redis.reachable ? "success" : "destructive"}>
              {redis.reachable ? "Reachable" : "Unreachable"}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">{redis.detail}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Timer className="size-4 text-muted-foreground" aria-hidden="true" />
            Rate limiter
          </CardTitle>
          <CardDescription>
            The single rate limiter (ADR-0003) — its state also lives in Redis.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm">
          {rateLimiter.redisBacked ? (
            <p>
              Active: sliding-window buckets are stored under{" "}
              <code className="font-mono text-xs">nuvia:ratelimit:*</code> keys.
            </p>
          ) : (
            <p>
              Disabled: REDIS_URL is not set, and per ADR-0003 the limiter is a no-op without Redis
              (no in-process fallback).
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Database className="size-4 text-muted-foreground" aria-hidden="true" />
            Why there is no flush button
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            This page never mutates cache state. A cache flush would be a destructive production
            action, and this repository ships no global flush function — the only FLUSHDB in the
            codebase belongs to the a11y test harness, clearing its own dedicated test Redis.
          </p>
          <p>Session entries expire on their own after {sessionCache.ttlSeconds} seconds.</p>
          <p className="text-xs">Probed at {checkedAt}.</p>
        </CardContent>
      </Card>
    </div>
  );
}
