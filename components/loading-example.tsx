"use client";

import { useEffect } from "react";
import { useLoading } from "@/contexts/loading-context";

/**
 * Example component showing how to use the loading context
 * 
 * Usage:
 * 1. Import useLoading hook
 * 2. Call startLoading with a unique key
 * 3. Update progress as needed (0-100)
 * 4. Call finishLoading when done
 */
export default function LoadingExample() {
  const { startLoading, updateProgress, finishLoading } = useLoading();

  const simulateLoading = () => {
    const loadingKey = "example-load";
    
    // Start loading
    startLoading(loadingKey);
    
    // Simulate progress updates
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      updateProgress(loadingKey, progress);
      
      if (progress >= 100) {
        clearInterval(interval);
        // Finish loading after a short delay
        setTimeout(() => {
          finishLoading(loadingKey);
        }, 500);
      }
    }, 300);
  };

  return (
    <div className="p-8 space-y-4">
      <h2 className="text-2xl font-bold">Loading Animation Example</h2>
      <p className="text-muted-foreground">
        Click the button below to see the Three.js rain-in-glass loading animation
      </p>
      <button
        onClick={simulateLoading}
        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
      >
        Trigger Loading Animation
      </button>
      
      <div className="mt-8 p-4 bg-muted rounded-lg">
        <h3 className="font-semibold mb-2">How to use in your pages:</h3>
        <pre className="text-sm overflow-x-auto">
{`import { useLoading } from "@/contexts/loading-context";

function YourPage() {
  const { startLoading, updateProgress, finishLoading } = useLoading();
  
  useEffect(() => {
    const fetchData = async () => {
      startLoading('page-data');
      
      try {
        // Simulate data fetching
        updateProgress('page-data', 30);
        await fetch('/api/data');
        
        updateProgress('page-data', 70);
        // More operations...
        
        updateProgress('page-data', 100);
      } finally {
        finishLoading('page-data');
      }
    };
    
    fetchData();
  }, []);
  
  return <div>Your content</div>;
}`}
        </pre>
      </div>
    </div>
  );
}
