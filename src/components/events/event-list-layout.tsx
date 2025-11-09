"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface EventListLayoutProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  showBackButton?: boolean;
  backUrl?: string;
  className?: string;
  children?: React.ReactNode;
  actions?: React.ReactNode;
  topRightActions?: React.ReactNode;
}

export function EventListLayout({
  title,
  description,
  icon,
  showBackButton = true,
  backUrl,
  className,
  children,
  actions,
  topRightActions,
}: EventListLayoutProps) {
  const router = useRouter();
  
  const handleGoBack = () => {
    if (backUrl) {
      router.push(backUrl);
    } else {
      router.back();
    }
  };

  return (
    <div className={cn("min-h-screen bg-background", className)}>
      {/* Page Header */}
      <div className="relative bg-background border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center">
              {showBackButton && (
                <Button
                  variant="ghost"
                  onClick={handleGoBack}
                  className="mr-4"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}
              
              <div className="flex items-center">
                {icon && (
                  <div className="mr-3">
                    {icon}
                  </div>
                )}
                
                <div className="flex items-center gap-4">
                  <div>
                    <h2 className="text-3xl font-bold text-foreground">
                      {title}
                    </h2>
                    
                    {description && (
                      <p className="mt-2 text-muted-foreground">
                        {description}
                      </p>
                    )}
                  </div>
                  
                  {actions && (
                    <div>
                      {actions}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {topRightActions && (
              <div className="flex items-center">
                {topRightActions}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Page Content */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}