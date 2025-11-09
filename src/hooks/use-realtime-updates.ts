"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

interface RealtimeUpdateConfig {
  /**
   * Whether real-time updates are enabled
   * @default true
   */
  enabled?: boolean;
  /**
   * Update interval in milliseconds
   * @default 30000 (30 seconds)
   */
  interval?: number;
  /**
   * Whether to pause updates when page is not visible
   * @default true
   */
  pauseWhenHidden?: boolean;
}

/**
 * Hook for managing real-time data updates
 * Automatically handles visibility changes and cleanup
 */
export function useRealtimeUpdates<T>(
  fetchFunction: () => Promise<T>,
  config: RealtimeUpdateConfig = {}
) {
  const {
    enabled = true,
    interval = 30000,
    pauseWhenHidden = true,
  } = config;

  const [data, setData] = React.useState<T | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = React.useState<Date | null>(null);
  const pathname = usePathname();

  // Fetch data function
  const fetchData = React.useCallback(async () => {
    try {
      setError(null);
      setIsLoading(true);
      const result = await fetchFunction();
      setData(result);
      setLastUpdate(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch data");
    } finally {
      setIsLoading(false);
    }
  }, [fetchFunction]);

  // Initial fetch
  React.useEffect(() => {
    if (enabled) {
      fetchData();
    }
  }, [enabled, fetchData]);

  // Set up interval for updates
  React.useEffect(() => {
    if (!enabled) return;

    let intervalId: NodeJS.Timeout | null = null;

    const startInterval = () => {
      if (intervalId) clearInterval(intervalId);
      intervalId = setInterval(fetchData, interval);
    };

    const stopInterval = () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };

    // Handle visibility changes
    const handleVisibilityChange = () => {
      if (pauseWhenHidden) {
        if (document.hidden) {
          stopInterval();
        } else {
          startInterval();
        }
      }
    };

    // Start interval if not hidden or pauseWhenHidden is false
    if (!pauseWhenHidden || !document.hidden) {
      startInterval();
    }

    // Listen for visibility changes
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      stopInterval();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [enabled, interval, pauseWhenHidden, fetchData]);

  // Pause updates during navigation
  React.useEffect(() => {
    setIsLoading(true);
  }, [pathname]);

  return {
    data,
    isLoading,
    error,
    lastUpdate,
    refetch: fetchData,
  };
}

/**
 * Hook for managing real-time updates for multiple widgets
 */
export function useWidgetRealtimeUpdates<WidgetId extends string, T>(
  widgets: Record<WidgetId, { fetchFunction: () => Promise<T>; config?: RealtimeUpdateConfig }>
) {
  const [updates, setUpdates] = React.useState<Partial<Record<WidgetId, T>>>({});
  const [loadingStates, setLoadingStates] = React.useState<Partial<Record<WidgetId, boolean>>>({});
  const [errors, setErrors] = React.useState<Partial<Record<WidgetId, string>>>({});

  // Initialize all widgets
  React.useEffect(() => {
    const widgetIds = Object.keys(widgets) as WidgetId[];

    widgetIds.forEach(widgetId => {
      const { fetchFunction, config } = widgets[widgetId];

      const updateWidget = async () => {
        try {
          setLoadingStates(prev => ({ ...prev, [widgetId]: true }));
          setErrors(prev => ({ ...prev, [widgetId]: undefined }));
          const data = await fetchFunction();
          setUpdates(prev => ({ ...prev, [widgetId]: data }));
        } catch (err) {
          setErrors(prev => ({
            ...prev,
            [widgetId]: err instanceof Error ? err.message : "Failed to fetch data"
          }));
        } finally {
          setLoadingStates(prev => ({ ...prev, [widgetId]: false }));
        }
      };

      if (config?.enabled !== false) {
        updateWidget();

        if (config?.interval && config.interval > 0) {
          const intervalId = setInterval(updateWidget, config.interval);
          return () => clearInterval(intervalId);
        }
      }
    });
  }, [widgets]);

  const refetchWidget = React.useCallback((widgetId: WidgetId) => {
    const { fetchFunction } = widgets[widgetId];

    const updateWidget = async () => {
      try {
        setLoadingStates(prev => ({ ...prev, [widgetId]: true }));
        setErrors(prev => ({ ...prev, [widgetId]: undefined }));
        const data = await fetchFunction();
        setUpdates(prev => ({ ...prev, [widgetId]: data }));
      } catch (err) {
        setErrors(prev => ({
          ...prev,
          [widgetId]: err instanceof Error ? err.message : "Failed to fetch data"
        }));
      } finally {
        setLoadingStates(prev => ({ ...prev, [widgetId]: false }));
      }
    };

    updateWidget();
  }, [widgets]);

  const refetchAll = React.useCallback(() => {
    Object.keys(widgets).forEach(widgetId => {
      refetchWidget(widgetId as WidgetId);
    });
  }, [widgets, refetchWidget]);

  return {
    updates,
    loadingStates,
    errors,
    refetchWidget,
    refetchAll,
  };
}