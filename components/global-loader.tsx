"use client";

import dynamic from "next/dynamic";
import { useLoading } from "@/contexts/loading-context";

// Dynamically import GlassLoader to avoid SSR issues with Three.js
const GlassLoader = dynamic(() => import("./glass-loader"), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm">
      <div className="text-center">
        <div className="h-16 w-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  ),
});

export default function GlobalLoader() {
  const { isLoading, progress } = useLoading();

  return <GlassLoader progress={progress} isLoading={isLoading} />;
}
