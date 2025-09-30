"use client";

import { animate } from "animejs";
import { useState, useEffect, useRef } from "react";

export default function ForgotPasswordLayout({ children }: { children: React.ReactNode }) {

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
    }, []
    )

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-6 md:p-8 relative overflow-hidden">
        <div ref={backgroundRef} className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Top shapes */}
        <div className="shape absolute top-[5%] left-[15%] w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 bg-blue-200 opacity-20 clip-hexagon"></div>
        <div className="shape absolute top-[8%] right-[18%] w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 bg-indigo-300 opacity-15 clip-triangle"></div>
        
        {/* Left side shapes */}
        <div className="shape absolute top-[35%] left-[8%] w-28 h-28 sm:w-36 sm:h-36 md:w-44 md:h-44 bg-blue-300 opacity-15 clip-hexagon"></div>
        <div className="shape absolute top-[55%] left-[12%] w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 bg-blue-400 opacity-10 clip-triangle"></div>
        
        {/* Right side shapes */}
        <div className="shape absolute top-[40%] right-[10%] w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 bg-indigo-200 opacity-10 clip-hexagon"></div>
        <div className="shape absolute top-[60%] right-[15%] w-24 h-24 sm:w-28 sm:h-28 md:w-36 md:h-36 bg-blue-400 opacity-15 clip-triangle"></div>
        
        {/* Bottom shapes */}
        <div className="shape absolute bottom-[10%] left-[20%] w-28 h-28 sm:w-36 sm:h-36 md:w-44 md:h-44 bg-indigo-200 opacity-15 clip-hexagon"></div>
        <div className="shape absolute bottom-[8%] right-[22%] w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 bg-blue-300 opacity-10 clip-triangle"></div>
      </div>

        {children}

         <style>{`
        .clip-hexagon {
          clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
        }
        .clip-triangle {
          clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
        }
      `}</style>
    </div>
  )
}