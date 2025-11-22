"use client";

import React, { createContext, useContext, useState, useCallback, useRef } from "react";

interface LoadingState {
  [key: string]: {
    progress: number;
    startTime: number;
  };
}

interface LoadingContextType {
  isLoading: boolean;
  progress: number;
  startLoading: (key: string) => void;
  updateProgress: (key: string, progress: number) => void;
  finishLoading: (key: string) => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

const MIN_LOADING_TIME = 2000; // 2 seconds minimum display time

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [loadingStates, setLoadingStates] = useState<LoadingState>({});
  const timeoutsRef = useRef<{ [key: string]: NodeJS.Timeout }>({});

  const startLoading = useCallback((key: string) => {
    setLoadingStates((prev) => ({
      ...prev,
      [key]: { progress: 0, startTime: Date.now() },
    }));
  }, []);

  const updateProgress = useCallback((key: string, progress: number) => {
    setLoadingStates((prev) => {
      if (!prev[key]) return prev;
      return {
        ...prev,
        [key]: {
          ...prev[key],
          progress: Math.min(100, Math.max(0, progress)),
        },
      };
    });
  }, []);

  const finishLoading = useCallback((key: string) => {
    setLoadingStates((prev) => {
      if (!prev[key]) return prev;

      const elapsed = Date.now() - prev[key].startTime;
      const remainingTime = Math.max(0, MIN_LOADING_TIME - elapsed);

      // Clear any existing timeout for this key
      if (timeoutsRef.current[key]) {
        clearTimeout(timeoutsRef.current[key]);
      }

      // If minimum time hasn't passed, delay the finish
      if (remainingTime > 0) {
        timeoutsRef.current[key] = setTimeout(() => {
          setLoadingStates((current) => {
            const newState = { ...current };
            delete newState[key];
            delete timeoutsRef.current[key];
            return newState;
          });
        }, remainingTime);
        return prev;
      }

      // Minimum time has passed, finish immediately
      const newState = { ...prev };
      delete newState[key];
      return newState;
    });
  }, []);

  // Calculate aggregate progress
  const loadingKeys = Object.keys(loadingStates);
  const isLoading = loadingKeys.length > 0;
  const progress = isLoading
    ? loadingKeys.reduce((sum, key) => sum + loadingStates[key].progress, 0) /
      loadingKeys.length
    : 0;

  return (
    <LoadingContext.Provider
      value={{
        isLoading,
        progress,
        startLoading,
        updateProgress,
        finishLoading,
      }}
    >
      {children}
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error("useLoading must be used within a LoadingProvider");
  }
  return context;
}
