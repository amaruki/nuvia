"use client";

import { animate } from "animejs";
import { useState, useEffect, useRef } from "react";

export default function ForgotPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const backgroundRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Animate background shapes with subtle, random movements
    if (backgroundRef.current) {
      const shapes = backgroundRef.current.querySelectorAll(".shape");

      shapes.forEach((shape, index) => {
        animate(shape, {
          translateX: () => Math.random() * 30 - 15,
          translateY: () => Math.random() * 30 - 15,
          rotate: () => Math.random() * 8 - 4,
          duration: () => 8000 + Math.random() * 4000, // 8-12 seconds per animation
          delay: index * 500, // Stagger the start of each shape
          direction: "alternate",
          loop: true,
          easing: "easeInOutQuad",
        });
      });
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-chart-1/10 to-chart-2/100 p-4 sm:p-6 md:p-8 relative overflow-hidden">
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: `
        repeating-linear-gradient(0deg, transparent, transparent 20px, rgba(75, 85, 99, 0.08) 20px, rgba(75, 85, 99, 0.08) 21px),
        repeating-linear-gradient(90deg, transparent, transparent 30px, rgba(107, 114, 128, 0.06) 30px, rgba(107, 114, 128, 0.06) 31px),
        repeating-linear-gradient(60deg, transparent, transparent 40px, rgba(55, 65, 81, 0.05) 40px, rgba(55, 65, 81, 0.05) 41px),
        repeating-linear-gradient(150deg, transparent, transparent 35px, rgba(31, 41, 55, 0.04) 35px, rgba(31, 41, 55, 0.04) 36px)
      `,
        }}
      />

      {children}
    </div>
  );
}

<div className="min-h-screen w-full bg-[#f8fafc] relative">
  {/* Circuit Board Background */}

  {/* Your Content/Components */}
</div>;
