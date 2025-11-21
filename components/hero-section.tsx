"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  FadeIn,
  StaggerContainer,
  StaggerItem,
} from "@/components/animated-components";
import { ArrowRight } from "lucide-react";
import { useTheme } from "next-themes";

// Dynamically import 3D components with no SSR
const Hero3DScene = dynamic(
  () =>
    import("@/components/hero-3d-scene").then((mod) => ({
      default: mod.Hero3DScene,
    })),
  { ssr: false }
);

const DataCoreCanvas = dynamic(
  () =>
    import("@/components/data-core-canvas").then((mod) => ({
      default: mod.DataCoreCanvas,
    })),
  { ssr: false }
);

export function HeroSection() {
  const { resolvedTheme } = useTheme();
  
  return (
    <section className="relative overflow-hidden min-h-[90vh] flex items-center">
      <Hero3DScene />

      <div className="container relative z-10 py-20 md:py-32 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
            {/* Text Content - Left Side */}
            <div className="flex-1 text-center lg:text-left">
              <FadeIn className="mb-8">
                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-sm backdrop-blur">
                  <Image
                    src={
                      resolvedTheme === "dark"
                        ? "/sui-logo-pack/Sui Symbol White/Sui_Symbol_White.svg"
                        : "/sui-logo-pack/Sui Symbol Sea/Sui_Symbol_Sea.svg"
                    }
                    alt="Sui Symbol"
                    width={16}
                    height={16}
                    className="h-4 w-4"
                  />
                  <span className="font-medium text-blue-300">
                    Powered by Sui Blockchain
                  </span>
                </div>
              </FadeIn>

              <FadeIn delay={0.1}>
                <h1 className="mb-6 text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
                  <span className="block bg-linear-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                    Build Better AI
                  </span>
                  <span className="block text-foreground mt-2">
                    With Web3 Data Labeling
                  </span>
                </h1>
              </FadeIn>

              <FadeIn delay={0.2}>
                <p className="mb-10 text-lg text-muted-foreground md:text-xl max-w-2xl mx-auto lg:mx-0">
                  The decentralized marketplace connecting AI builders with
                  skilled data labelers. Fair pay, transparent quality, powered
                  by blockchain.
                </p>
              </FadeIn>

              <FadeIn
                delay={0.3}
                className="flex flex-col gap-4 sm:flex-row sm:justify-center lg:justify-start mb-8"
              >
                <Button
                  size="lg"
                  className="group bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Link href="/tasks" className="flex items-center">
                    Start Labeling
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-purple-500/50 hover:bg-purple-500/10"
                >
                  <Link href="/dashboard/create-task">Create Task</Link>
                </Button>
              </FadeIn>
            </div>

            {/* 3D Data Core - Right Side */}
            <FadeIn delay={0.4} className="flex-1 w-full lg:w-auto">
              <DataCoreCanvas />
            </FadeIn>
          </div>

          {/* Stats */}
          <StaggerContainer className="grid grid-cols-2 gap-6 md:grid-cols-4 max-w-4xl mx-auto mt-16">
            <StaggerItem>
              <div className="text-center p-4 rounded-lg bg-background/40 backdrop-blur border border-white/10">
                <div className="text-4xl font-bold bg-linear-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
                  0
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Tasks Completed
                </div>
              </div>
            </StaggerItem>
            <StaggerItem>
              <div className="text-center p-4 rounded-lg bg-background/40 backdrop-blur border border-white/10">
                <div className="text-4xl font-bold bg-linear-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
                  0
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Active Labelers
                </div>
              </div>
            </StaggerItem>
            <StaggerItem>
              <div className="text-center p-4 rounded-lg bg-background/40 backdrop-blur border border-white/10">
                <div className="text-4xl font-bold bg-linear-to-r from-pink-400 to-pink-600 bg-clip-text text-transparent">
                  0 SUI
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Total Rewards
                </div>
              </div>
            </StaggerItem>
            <StaggerItem>
              <div className="text-center p-4 rounded-lg bg-background/40 backdrop-blur border border-white/10">
                <div className="text-4xl font-bold bg-linear-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
                  95%
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Quality Score
                </div>
              </div>
            </StaggerItem>
          </StaggerContainer>
        </div>
      </div>
    </section>
  );
}
