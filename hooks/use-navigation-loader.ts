"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useLoading } from "@/contexts/loading-context";

/**
 * Hook to show loading animation during page navigation
 * Automatically tracks route changes and shows the glass loader
 */
export function useNavigationLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { startLoading, updateProgress, finishLoading } = useLoading();

  useEffect(() => {
    const loadingKey = "navigation";

    // Start loading when navigation begins
    startLoading(loadingKey);
    updateProgress(loadingKey, 30);

    // Simulate loading progress
    const timer1 = setTimeout(() => {
      updateProgress(loadingKey, 60);
    }, 100);

    const timer2 = setTimeout(() => {
      updateProgress(loadingKey, 90);
    }, 200);

    // Finish loading when page is ready
    const timer3 = setTimeout(() => {
      updateProgress(loadingKey, 100);
      finishLoading(loadingKey);
    }, 300);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      finishLoading(loadingKey);
    };
  }, [pathname, searchParams, startLoading, updateProgress, finishLoading]);
}
