"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { animate } from "animejs";
import { authClient } from "@/lib/client";

export default function OAuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Processing authentication...");

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        // Check if we have a session after OAuth redirect
        const { data: session, error } = await authClient.getSession({
          fetchOptions: {
            onSuccess: () => {
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
                router.push("/dashboard");
              }, 2000);
            },
            onError: (error) => {
              setStatus("error");
              setMessage("Authentication failed. Please try again.");
              console.error("OAuth callback error:", error);

              // Redirect to login page after showing error
              setTimeout(() => {
                router.push("/auth/login?error=oauth_failed");
              }, 3000);
            },
          },
        });

        if (error) {
          throw error;
        }
      } catch (error) {
        console.error("OAuth callback handling error:", error);
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        );
      case "success":
        return (
          <svg className="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
          </svg>
        );
      case "error":
        return (
          <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        );
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case "loading":
        return "text-blue-600";
      case "success":
        return "text-green-600";
      case "error":
        return "text-red-600";
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="callback-card bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center opacity-0">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img
            src="/logo.png"
            alt="Nuvia Logo"
            width={60}
            height={60}
            className="rounded-md"
          />
        </div>

        {/* Status Icon */}
        <div className="flex justify-center mb-6">
          {getStatusIcon()}
        </div>

        {/* Status Message */}
        <h1 className={`text-xl font-semibold mb-2 ${getStatusColor()}`}>
          {status === "loading" && "Authentication in Progress"}
          {status === "success" && "Authentication Successful"}
          {status === "error" && "Authentication Failed"}
        </h1>

        <p className="text-gray-600 mb-6">
          {message}
        </p>

        {/* Progress Bar for Loading State */}
        {status === "loading" && (
          <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
            <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: "60%" }}></div>
          </div>
        )}

        {/* Additional Info */}
        <div className="text-sm text-gray-500">
          {status === "loading" && "Please wait while we complete your authentication..."}
          {status === "success" && "You will be redirected to your dashboard shortly."}
          {status === "error" && "You will be redirected to the login page."}
        </div>
      </div>
    </div>
  );
}