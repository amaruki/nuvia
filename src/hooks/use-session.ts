"use client";

import { useState, useEffect } from "react";

interface User {
  id: string;
  username: string;
  email: string;
  displayName?: string;
  image?: string;
  bio?: string;
  role?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface SessionData {
  user: User | null;
  isPending: boolean;
  error: string | null;
}

export function useSession(): SessionData {
  const [sessionData, setSessionData] = useState<SessionData>({
    user: null,
    isPending: true,
    error: null,
  });

  useEffect(() => {
    // Mock session data for now
    // In a real implementation, this would fetch from the auth API
    const mockUser: User = {
      id: "1",
      username: "testuser",
      email: "test@example.com",
      displayName: "Test User",
      image: undefined,
      bio: "This is a test bio",
      role: "USER",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Simulate loading
    setTimeout(() => {
      setSessionData({
        user: mockUser,
        isPending: false,
        error: null,
      });
    }, 500);
  }, []);

  return sessionData;
}