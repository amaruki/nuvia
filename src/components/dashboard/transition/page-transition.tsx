"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
  /**
   * Transition duration in milliseconds
   * @default 200
   */
  duration?: number;
  /**
   * Whether to show a fade effect
   * @default true
   */
  fade?: boolean;
  /**
   * Whether to show a slide effect
   * @default false
   */
  slide?: boolean;
  /**
   * Slide direction when slide is enabled
   * @default "right"
   */
  slideDirection?: "left" | "right" | "up" | "down";
}

/**
 * Page transition component that provides smooth content transitions
 * during navigation while preserving layout structure
 */
export function PageTransition({
  children,
  className,
  duration = 200,
  fade = true,
  slide = false,
  slideDirection = "right",
}: PageTransitionProps) {
  const [isTransitioning, setIsTransitioning] = React.useState(false);
  const [displayChildren, setDisplayChildren] = React.useState(children);

  React.useEffect(() => {
    // Start transition when children change
    setIsTransitioning(true);

    // After fade out, update children
    const timeout = setTimeout(() => {
      setDisplayChildren(children);
      setIsTransitioning(false);
    }, duration / 2);

    return () => clearTimeout(timeout);
  }, [children, duration]);

  const getSlideTransform = () => {
    if (!slide) return "translateX(0)";

    const transforms = {
      left: "translateX(-100%)",
      right: "translateX(100%)",
      up: "translateY(-100%)",
      down: "translateY(100%)",
    };

    return transforms[slideDirection];
  };

  const transitionStyles = {
    transition: `all ${duration}ms ease-in-out`,
    opacity: fade && isTransitioning ? 0.3 : 1,
    transform: slide && isTransitioning ? getSlideTransform() : "translateX(0)",
  };

  return (
    <div
      className={cn(
        "w-full h-full",
        "transition-all ease-in-out",
        isTransitioning && "pointer-events-none",
        className,
      )}
      style={transitionStyles}
    >
      {displayChildren}
    </div>
  );
}

/**
 * Hook to trigger page transitions manually
 * Useful for async operations where you need to control the timing
 */
export function usePageTransition() {
  const [isTransitioning, setIsTransitioning] = React.useState(false);

  const startTransition = React.useCallback(() => {
    setIsTransitioning(true);
  }, []);

  const endTransition = React.useCallback(() => {
    setIsTransitioning(false);
  }, []);

  return {
    isTransitioning,
    startTransition,
    endTransition,
  };
}
