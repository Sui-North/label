"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import { Navbar } from "@/components/navbar";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-8 animate-in fade-in zoom-in-95 duration-500">
          <div className="relative mx-auto h-32 w-32">
            <div className="absolute inset-0 bg-destructive/20 blur-3xl rounded-full animate-pulse" />
            <div className="relative h-full w-full bg-destructive/10 rounded-full flex items-center justify-center border-2 border-destructive/20">
              <AlertCircle className="h-16 w-16 text-destructive" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Something went wrong!
            </h1>
            <p className="text-muted-foreground">
              We encountered an unexpected error. Our team has been notified.
            </p>
            {error.message && (
                <div className="p-4 bg-muted/50 rounded-lg text-xs font-mono text-muted-foreground overflow-auto max-h-32 text-left border">
                    {error.message}
                </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
                onClick={() => reset()}
                className="shadow-lg shadow-primary/20"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
            <Button variant="outline" asChild className="glass-card hover:bg-background/80">
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Go Home
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
