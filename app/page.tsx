"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/navbar";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  FadeIn,
  StaggerContainer,
  StaggerItem,
} from "@/components/animated-components";
import { HeroSection } from "@/components/hero-section";
import {
  Zap,
  Shield,
  Globe,
  TrendingUp,
  Users,
  Award,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { useAllTasks } from "@/hooks/use-tasks";
import { useAllSubmissions } from "@/hooks/use-submissions";
import { CursorCanvas } from "@/components/cursor-effects/cursor-canvas";
import { SectionTrigger } from "@/components/cursor-effects/section-trigger";

export default function HomePage() {
  const { data: tasks, isLoading: tasksLoading } = useAllTasks();
  const { data: submissions, isLoading: submissionsLoading } =
    useAllSubmissions();

  // Calculate statistics
  const totalTasks = tasks?.length || 0;
  const activeTasks = tasks?.filter((task) => task.status === "0" || task.status === "1").length || 0;
  const totalBounty =
    tasks?.reduce((sum, task) => sum + (Number(task.bounty) || 0), 0) || 0;
  const totalBountySUI = (totalBounty / 1_000_000_000).toFixed(2);
  const totalSubmissions = submissions?.length || 0;

  return (
    <>
      <CursorCanvas />
      <Navbar />
      <div className="relative overflow-hidden">
        {/* Ambient Background Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-primary/20 blur-[120px] rounded-full pointer-events-none -z-10 opacity-50" />
        
        {/* Hero Section */}
        <SectionTrigger effect="hero">
          <HeroSection />
        </SectionTrigger>

        {/* Features Section */}
        <SectionTrigger effect="features">
        <section className="py-24 relative">
          <div className="container px-4 sm:px-6 lg:px-8">
            <FadeIn className="mx-auto max-w-2xl text-center mb-16">
              <h2 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4">
                Why Choose <span className="text-gradient">Songsim Label</span>?
              </h2>
              <p className="text-lg text-muted-foreground">
                The decentralized standard for AI training data.
              </p>
            </FadeIn>

            <StaggerContainer className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <StaggerItem>
                <div className="glass-card p-6 rounded-2xl hover:border-primary/50 transition-all duration-300 group">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Zap className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Instant Payouts</h3>
                  <p className="text-muted-foreground">
                    Smart contract escrow ensures automatic payment upon task
                    completion. No delays, no intermediaries.
                  </p>
                </div>
              </StaggerItem>

              <StaggerItem>
                <div className="glass-card p-6 rounded-2xl hover:border-primary/50 transition-all duration-300 group">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Transparent Quality</h3>
                  <p className="text-muted-foreground">
                    Consensus mechanisms and on-chain reputation ensure
                    high-quality labels you can trust.
                  </p>
                </div>
              </StaggerItem>

              <StaggerItem>
                <div className="glass-card p-6 rounded-2xl hover:border-primary/50 transition-all duration-300 group">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Globe className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Global Access</h3>
                  <p className="text-muted-foreground">
                    Permissionless platform accessible to anyone, anywhere in
                    the world. No KYC barriers.
                  </p>
                </div>
              </StaggerItem>

              <StaggerItem>
                <div className="glass-card p-6 rounded-2xl hover:border-primary/50 transition-all duration-300 group">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <TrendingUp className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Fair Pricing</h3>
                  <p className="text-muted-foreground">
                    10x lower costs than centralized platforms with zero
                    hidden fees. Just Sui gas fees.
                  </p>
                </div>
              </StaggerItem>

              <StaggerItem>
                <div className="glass-card p-6 rounded-2xl hover:border-primary/50 transition-all duration-300 group">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Community Driven</h3>
                  <p className="text-muted-foreground">
                    DAO governance gives power to the community, not
                    corporations. You own the platform.
                  </p>
                </div>
              </StaggerItem>

              <StaggerItem>
                <div className="glass-card p-6 rounded-2xl hover:border-primary/50 transition-all duration-300 group">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Award className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Gamified Rewards</h3>
                  <p className="text-muted-foreground">
                    Prize pools, leaderboards, and reputation NFTs incentivize
                    excellence and engagement.
                  </p>
                </div>
              </StaggerItem>
            </StaggerContainer>
          </div>
        </section>
        </SectionTrigger>

        {/* How It Works - Requesters */}
        <SectionTrigger effect="default">
        <section className="py-24 relative bg-muted/30">
          <div className="container px-4 sm:px-6 lg:px-8">
            <FadeIn className="mx-auto max-w-6xl">
              <div className="text-center mb-16">
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
                  For AI Builders
                </h2>
                <p className="text-xl text-muted-foreground">
                  Create and manage labeling tasks in minutes
                </p>
              </div>

              <StaggerContainer className="grid gap-8 md:grid-cols-3 relative">
                <StaggerItem>
                  <div className="relative p-8 rounded-2xl border border-border bg-background/50 backdrop-blur hover:border-primary/50 transition-all group">
                    <div className="absolute -top-6 left-8 h-12 w-12 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold text-xl shadow-lg shadow-primary/30">
                      1
                    </div>
                    <div className="mt-4">
                      <h3 className="text-2xl font-bold mb-3">Upload Dataset</h3>
                      <p className="text-muted-foreground leading-relaxed">
                        Upload your data to decentralized Walrus storage and
                        define annotation requirements.
                      </p>
                    </div>
                  </div>
                </StaggerItem>

                <StaggerItem>
                  <div className="relative p-8 rounded-2xl border border-border bg-background/50 backdrop-blur hover:border-primary/50 transition-all group">
                    <div className="absolute -top-6 left-8 h-12 w-12 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold text-xl shadow-lg shadow-primary/30">
                      2
                    </div>
                    <div className="mt-4">
                      <h3 className="text-2xl font-bold mb-3">Set Bounty</h3>
                      <p className="text-muted-foreground leading-relaxed">
                        Stake SUI tokens as bounty. Smart contracts ensure
                        automatic and fair distribution.
                      </p>
                    </div>
                  </div>
                </StaggerItem>

                <StaggerItem>
                  <div className="relative p-8 rounded-2xl border border-border bg-background/50 backdrop-blur hover:border-primary/50 transition-all group">
                    <div className="absolute -top-6 left-8 h-12 w-12 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold text-xl shadow-lg shadow-primary/30">
                      3
                    </div>
                    <div className="mt-4">
                      <h3 className="text-2xl font-bold mb-3">Get Labels</h3>
                      <p className="text-muted-foreground leading-relaxed">
                        Receive high-quality labeled data through consensus
                        validation from expert labelers.
                      </p>
                    </div>
                  </div>
                </StaggerItem>
              </StaggerContainer>
            </FadeIn>
          </div>
        </section>
        </SectionTrigger>

        {/* Stats Section */}
        <SectionTrigger effect="stats">
        <section className="py-20 relative overflow-hidden">
           <div className="absolute inset-0 bg-primary/5" />
           <div className="container px-4 sm:px-6 lg:px-8 relative z-10">
            <FadeIn className="mx-auto max-w-2xl text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
                Platform Statistics
              </h2>
              <p className="text-lg text-muted-foreground">
                Real-time data from the Sui blockchain
              </p>
            </FadeIn>

            <div className="grid md:grid-cols-4 gap-6 max-w-5xl mx-auto">
              <div className="glass-card p-6 rounded-2xl text-center">
                <div className="text-4xl font-bold text-primary mb-2">
                  {tasksLoading ? "..." : totalTasks}
                </div>
                <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Tasks</div>
              </div>

              <div className="glass-card p-6 rounded-2xl text-center">
                <div className="text-4xl font-bold text-primary mb-2">
                  {tasksLoading ? "..." : activeTasks}
                </div>
                <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Active Tasks</div>
              </div>

              <div className="glass-card p-6 rounded-2xl text-center">
                <div className="text-4xl font-bold text-primary mb-2">
                  {submissionsLoading ? "..." : totalSubmissions}
                </div>
                <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Submissions</div>
              </div>

              <div className="glass-card p-6 rounded-2xl text-center">
                <div className="text-4xl font-bold text-primary mb-2">
                  {tasksLoading ? "..." : totalBountySUI}
                </div>
                <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider">SUI Paid Out</div>
              </div>
            </div>
          </div>
        </section>
        </SectionTrigger>

        {/* CTA Section */}
        <SectionTrigger effect="cta">
        <section className="py-24 relative overflow-hidden">
          <div className="container px-4 sm:px-6 lg:px-8 relative z-10">
            <FadeIn>
              <div className="glass-card rounded-3xl p-8 md:p-16 text-center max-w-4xl mx-auto border-primary/20 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-linear-to-br from-primary/10 to-transparent -z-10" />
                
                <h2 className="text-4xl sm:text-5xl font-bold mb-6">
                  Ready to Get Started?
                </h2>
                <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
                  Join the decentralized data labeling revolution. Fair pay,
                  transparent quality, instant rewards.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    size="lg"
                    className="h-14 px-8 text-lg rounded-full shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all"
                    asChild
                  >
                    <Link href="/tasks">
                      Start Labeling <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-14 px-8 text-lg rounded-full border-primary/20 hover:bg-primary/5"
                    asChild
                  >
                    <Link href="/dashboard/create-task">
                      Create Your First Task
                    </Link>
                  </Button>
                </div>
              </div>
            </FadeIn>
          </div>
        </section>
        </SectionTrigger>

        {/* Footer */}
        <footer className="border-t py-12 bg-muted/30">
          <div className="container px-4 sm:px-6 lg:px-8">
            <div className="grid gap-8 md:grid-cols-4">
              <div>
                <h3 className="font-bold mb-4 text-lg">Songsim Label</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Decentralized data labeling marketplace on Sui blockchain.
                  Building the future of AI with fair work.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Product</h4>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li>
                    <Link href="/tasks" className="hover:text-primary transition-colors">
                      Browse Tasks
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/dashboard/create-task"
                      className="hover:text-primary transition-colors"
                    >
                      Create Task
                    </Link>
                  </li>
                  <li>
                    <Link href="/leaderboard" className="hover:text-primary transition-colors">
                      Leaderboard
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Resources</h4>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li>
                    <Link href="/docs" className="hover:text-primary transition-colors">
                      Documentation
                    </Link>
                  </li>
                  <li>
                    <Link href="/docs/guide" className="hover:text-primary transition-colors">
                      User Guide
                    </Link>
                  </li>
                  <li>
                    <Link href="/docs/api" className="hover:text-primary transition-colors">
                      API
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Community</h4>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li>
                    <a
                      href="https://github.com"
                      className="hover:text-primary transition-colors"
                    >
                      GitHub
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://discord.com"
                      className="hover:text-primary transition-colors"
                    >
                      Discord
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://twitter.com"
                      className="hover:text-primary transition-colors"
                    >
                      Twitter
                    </a>
                  </li>
                </ul>
              </div>
            </div>
            <div className="mt-12 border-t pt-8 text-center text-sm text-muted-foreground">
              <p>&copy; 2025 Songsim Label. Built with ❤️ on Sui.</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
