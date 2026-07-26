"use client";

import { useState, useEffect } from "react";
import { Announcement } from "@/types/announcement.types";
import { useAnnouncements } from "@/lib/hooks/use-announcements";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, ChevronLeft, ChevronRight, Gift, Star, Calendar, Bell } from "lucide-react";

interface AnnouncementBannerProps {
  className?: string;
}

export function AnnouncementBanner({ className = "" }: AnnouncementBannerProps) {
  const { announcements } = useAnnouncements();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [dismissedBanners, setDismissedBanners] = useState<Set<string>>(new Set());

  // Filter for banner announcements that haven't been dismissed
  const bannerAnnouncements = announcements.filter(
    (announcement) =>
      announcement.type === "banner" &&
      announcement.status === "published" &&
      !dismissedBanners.has(announcement.id) &&
      (!announcement.expiresAt || new Date(announcement.expiresAt) > new Date()),
  );

  // Load dismissed banners from localStorage
  useEffect(() => {
    const dismissed = localStorage.getItem("dismissedAnnouncementBanners");
    if (dismissed) {
      setDismissedBanners(new Set(JSON.parse(dismissed)));
    }
  }, []);

  // Save dismissed banners to localStorage
  useEffect(() => {
    if (dismissedBanners.size > 0) {
      localStorage.setItem(
        "dismissedAnnouncementBanners",
        JSON.stringify(Array.from(dismissedBanners)),
      );
    }
  }, [dismissedBanners]);

  // Auto-rotate banners
  useEffect(() => {
    if (bannerAnnouncements.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % bannerAnnouncements.length);
    }, 8000); // Change banner every 8 seconds

    return () => clearInterval(interval);
  }, [bannerAnnouncements.length]);

  // Reset index when announcements change
  useEffect(() => {
    setCurrentIndex(0);
  }, [bannerAnnouncements.length]);

  if (bannerAnnouncements.length === 0 || !isVisible) {
    return null;
  }

  const currentBanner = bannerAnnouncements[currentIndex];

  const handleDismiss = () => {
    setDismissedBanners((prev) => new Set([...prev, currentBanner.id]));
    if (bannerAnnouncements.length === 1) {
      setIsVisible(false);
    } else {
      // Move to next banner if available
      setCurrentIndex((prev) => (prev + 1) % bannerAnnouncements.length);
    }
  };

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? bannerAnnouncements.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % bannerAnnouncements.length);
  };

  const getBannerIcon = (type: string) => {
    switch (type) {
      case "banner":
        return <Gift className="h-5 w-5" />;
      case "celebration":
        return <Star className="h-5 w-5" />;
      case "event":
        return <Calendar className="h-5 w-5" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  };

  const getBannerColor = (type: string) => {
    switch (type) {
      case "banner":
        return "bg-gradient-to-r from-purple-600 to-pink-600";
      case "celebration":
        return "bg-gradient-to-r from-yellow-500 to-orange-500";
      case "event":
        return "bg-gradient-to-r from-blue-600 to-cyan-600";
      default:
        return "bg-gradient-to-r from-gray-600 to-gray-700";
    }
  };

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-50 ${className}`}>
      <div className={`${getBannerColor(currentBanner.type)} text-white shadow-lg`}>
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <div className="flex-shrink-0">{getBannerIcon(currentBanner.type)}</div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <Badge variant="secondary" className="text-xs font-semibold">
                    {currentBanner.type}
                  </Badge>
                  {currentBanner.isUrgent && (
                    <Badge variant="destructive" className="text-xs font-semibold">
                      Urgent
                    </Badge>
                  )}
                </div>

                <h3 className="font-semibold text-sm md:text-base truncate">
                  {currentBanner.title}
                </h3>

                <p className="text-xs md:text-sm opacity-90 truncate mt-1">
                  {currentBanner.excerpt}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 flex-shrink-0 ml-4">
              {bannerAnnouncements.length > 1 && (
                <div className="flex items-center space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handlePrevious}
                    className="text-white hover:bg-white/20 p-1 h-8 w-8"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  <span className="text-xs font-medium">
                    {currentIndex + 1} / {bannerAnnouncements.length}
                  </span>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleNext}
                    className="text-white hover:bg-white/20 p-1 h-8 w-8"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                className="text-white hover:bg-white/20 p-1 h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Progress indicator for auto-rotation */}
          {bannerAnnouncements.length > 1 && (
            <div className="flex space-x-1 mt-2 justify-center">
              {bannerAnnouncements.map((_, index) => (
                <div
                  key={index}
                  className={`h-1 rounded-full transition-all duration-300 ${
                    index === currentIndex ? "bg-white w-8" : "bg-white/40 w-4"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
