"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { animate } from "animejs";
import { authClient } from "@/lib/client";
import { logger } from "@/lib/logger";
import Image from "next/image";

export default function OAuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Processing authentication...");

  useEffect(() => {
    const handleOAuthCallback = async () => {
      // Check for OAuth conflict error in URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      const error = urlParams.get("error");
      const errorDescription = urlParams.get("error_description");
      const provider = urlParams.get("provider");

      // If there's an OAuth conflict error, show it immediately
      if (error === "oauth_conflict") {
        setStatus("error");
        setMessage(
          errorDescription ||
            "This email is already registered with a different authentication method.",
        );

        // Redirect to login page after showing error
        setTimeout(() => {
          router.push(`/auth/login?error=oauth_conflict&provider=${provider || ""}`);
        }, 5000);
        return;
      }

      // Handle other OAuth errors
      if (error && error !== "oauth_conflict") {
        setStatus("error");
        setMessage(errorDescription || "Authentication failed. Please try again.");

        // Redirect to login page after showing error
        setTimeout(() => {
          router.push(`/auth/login?error=${error}&provider=${provider || ""}`);
        }, 3000);
        return;
      }

      try {
        // First, let's try to get the session using the better-auth client
        const { data: session, error: sessionError } = await authClient.getSession();

        if (sessionError) {
          throw sessionError;
        }

        if (session?.user) {
          setStatus("success");
          setMessage("Authentication successful! Redirecting to dashboard...");

          // Animate success state
          animate(".callback-card", {
            scale: [1, 1.05, 1],
            duration: 500,
            easing: "easeInOutQuad",
          });

          // Redirect to dashboard after a short delay
          setTimeout(() => {
            window.location.assign("/dashboard");
          }, 2000);
        } else {
          // If no session, check if we have OAuth callback parameters
          const urlParams = new URLSearchParams(window.location.search);
          const code = urlParams.get("code");
          const state = urlParams.get("state");
          const provider = urlParams.get("provider");
          const error = urlParams.get("error");

          // If there's an error in the URL parameters, show it
          if (error) {
            setStatus("error");
            setMessage(
              urlParams.get("error_description") || "Authentication failed. Please try again.",
            );

            // Redirect to login page after showing error
            setTimeout(() => {
              router.push(`/auth/login?error=${error}&provider=${provider || ""}`);
            }, 3000);
            return;
          }

          if (code && state && provider) {
            // If we have OAuth parameters, try to complete the OAuth flow
            try {
              const { data: oauthSession, error: oauthError } = await authClient.signIn.social({
                provider: provider as any,
                callbackURL: "/dashboard",
              });

              if (oauthError) {
                throw oauthError;
              }

              if (oauthSession) {
                setStatus("success");
                setMessage("Authentication successful! Redirecting to dashboard...");

                // Animate success state
                animate(".callback-card", {
                  scale: [1, 1.05, 1],
                  duration: 500,
                  easing: "easeInOutQuad",
                });

                // Redirect to dashboard after a short delay
                setTimeout(() => {
                  window.location.assign("/dashboard");
                }, 2000);
              }
            } catch (oauthError) {
              logger.error("OAuth completion error", oauthError);
              setStatus("error");
              setMessage("Failed to complete authentication. Please try again.");

              // Redirect to login page after showing error
              setTimeout(() => {
                router.push("/auth/login?error=oauth_completion_failed");
              }, 3000);
            }
          } else {
            setStatus("error");
            setMessage("No authentication session found. Please try again.");

            // Redirect to login page after showing error
            setTimeout(() => {
              router.push("/auth/login?error=no_session");
            }, 3000);
          }
        }
      } catch (error) {
        logger.error(
          "OAuth callback error",
          error instanceof Error ? error.message : String(error),
        );
        setStatus("error");
        setMessage("An error occurred during authentication. Please try again.");

        // Redirect to login page after showing error
        setTimeout(() => {
          router.push("/auth/login?error=oauth_error");
        }, 3000);
      }
    };

    handleOAuthCallback();

    // Animate card entrance
    animate(".callback-card", {
      translateY: [50, 0],
      opacity: [0, 1],
      duration: 1000,
      easing: "easeOutExpo",
    });
  }, [router]);

  const getStatusIcon = () => {
    switch (status) {
      case "loading":
        return (
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        );
      case "success":
        return (
          <svg
            className="w-12 h-12 text-primary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M5 13l4 4L19 7"
            ></path>
          </svg>
        );
      case "error":
        return (
          <svg
            className="w-12 h-12 text-destructive"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M6 18L18 6M6 6l12 12"
            ></path>
          </svg>
        );
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md">
        {/* Logo and title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-4 bg-foreground">
            <Image src="/logo.png" alt="Nuvia Logo" width={60} height={60} className="rounded-md" />
          </div>
          <h1 className="text-2xl font-semibold text-foreground">
            {status === "loading" && "Authentication in Progress"}
            {status === "success" && "Authentication Successful"}
            {status === "error" && "Authentication Failed"}
          </h1>
          <p className="text-sm mt-1 text-muted-foreground">{message}</p>
        </div>

        {/* Status card */}
        <div className="callback-card rounded-2xl border p-8 shadow-sm bg-card border-border">
          {/* Status Icon */}
          <div className="flex justify-center mb-6">{getStatusIcon()}</div>

          {/* Progress Bar for Loading State */}
          {status === "loading" && (
            <div className="w-full bg-muted rounded-full h-2 mb-6">
              <div
                className="bg-primary h-2 rounded-full animate-pulse"
                style={{ width: "60%" }}
              ></div>
            </div>
          )}

          {/* Additional Info */}
          <div className="text-sm text-muted-foreground text-center">
            {status === "loading" && "Please wait while we complete your authentication..."}
            {status === "success" && "You will be redirected to your dashboard shortly."}
            {status === "error" && "You will be redirected to the login page."}
          </div>
        </div>
      </div>
    </div>
  );
}
