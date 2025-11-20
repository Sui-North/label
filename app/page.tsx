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
} from "lucide-react";
import { useAllTasks } from "@/hooks/use-tasks";
import { useAllSubmissions } from "@/hooks/use-submissions";

export default function HomePage() {
  const { data: tasks, isLoading: tasksLoading } = useAllTasks();
  const { data: submissions, isLoading: submissionsLoading } =
    useAllSubmissions();

  // Calculate statistics
  const totalTasks = tasks?.length || 0;
  const activeTasks = tasks?.filter((task) => task.status === "0").length || 0;
  const totalBounty =
    tasks?.reduce((sum, task) => sum + (Number(task.bounty) || 0), 0) || 0;
  const totalBountySUI = (totalBounty / 1_000_000_000).toFixed(2);
  const totalSubmissions = submissions?.length || 0;
  return (
    <>
      <Navbar />
      <div className="px-4 sm:px-6 lg:px-8">
        {/* Hero Section with 3D Background and Morphing Shape */}
        <HeroSection />

        {/* Features Section */}
        <section className="py-24 bg-muted/30 relative overflow-hidden">
          <div className="container">
            <FadeIn className="mx-auto max-w-2xl text-center mb-16">
              <h2 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4">
                Why Choose Songsim Label?
              </h2>
              <p className="text-lg text-muted-foreground">
                Built for the decentralized future of AI training data
              </p>
            </FadeIn>

            <StaggerContainer className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <StaggerItem>
                <Card className="border-2 border-blue-500/20 hover:border-blue-500 transition-all hover:shadow-lg hover:shadow-blue-500/20 bg-background/50 backdrop-blur">
                  <CardHeader>
                    <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center mb-4">
                      <Zap className="h-6 w-6 text-blue-500" />
                    </div>
                    <CardTitle className="text-xl">Instant Payouts</CardTitle>
                    <CardDescription className="text-base">
                      Smart contract escrow ensures automatic payment upon task
                      completion. No delays, no intermediaries.
                    </CardDescription>
                  </CardHeader>
                </Card>
              </StaggerItem>

              <StaggerItem>
                <Card className="border-2 border-purple-500/20 hover:border-purple-500 transition-all hover:shadow-lg hover:shadow-purple-500/20 bg-background/50 backdrop-blur">
                  <CardHeader>
                    <div className="h-12 w-12 rounded-lg bg-purple-500/10 flex items-center justify-center mb-4">
                      <Shield className="h-6 w-6 text-purple-500" />
                    </div>
                    <CardTitle className="text-xl">
                      Transparent Quality
                    </CardTitle>
                    <CardDescription className="text-base">
                      Consensus mechanisms and on-chain reputation ensure
                      high-quality labels you can trust.
                    </CardDescription>
                  </CardHeader>
                </Card>
              </StaggerItem>

              <StaggerItem>
                <Card className="border-2 border-pink-500/20 hover:border-pink-500 transition-all hover:shadow-lg hover:shadow-pink-500/20 bg-background/50 backdrop-blur">
                  <CardHeader>
                    <div className="h-12 w-12 rounded-lg bg-pink-500/10 flex items-center justify-center mb-4">
                      <Globe className="h-6 w-6 text-pink-500" />
                    </div>
                    <CardTitle className="text-xl">Global Access</CardTitle>
                    <CardDescription className="text-base">
                      Permissionless platform accessible to anyone, anywhere in
                      the world. No KYC barriers.
                    </CardDescription>
                  </CardHeader>
                </Card>
              </StaggerItem>

              <StaggerItem>
                <Card className="border-2 border-orange-500/20 hover:border-orange-500 transition-all hover:shadow-lg hover:shadow-orange-500/20 bg-background/50 backdrop-blur">
                  <CardHeader>
                    <div className="h-12 w-12 rounded-lg bg-orange-500/10 flex items-center justify-center mb-4">
                      <TrendingUp className="h-6 w-6 text-orange-500" />
                    </div>
                    <CardTitle className="text-xl">Fair Pricing</CardTitle>
                    <CardDescription className="text-base">
                      10x lower costs than centralized platforms with zero
                      hidden fees. Just Sui gas fees.
                    </CardDescription>
                  </CardHeader>
                </Card>
              </StaggerItem>

              <StaggerItem>
                <Card className="border-2 border-green-500/20 hover:border-green-500 transition-all hover:shadow-lg hover:shadow-green-500/20 bg-background/50 backdrop-blur">
                  <CardHeader>
                    <div className="h-12 w-12 rounded-lg bg-green-500/10 flex items-center justify-center mb-4">
                      <Users className="h-6 w-6 text-green-500" />
                    </div>
                    <CardTitle className="text-xl">Community Driven</CardTitle>
                    <CardDescription className="text-base">
                      DAO governance gives power to the community, not
                      corporations. You own the platform.
                    </CardDescription>
                  </CardHeader>
                </Card>
              </StaggerItem>

              <StaggerItem>
                <Card className="border-2 border-yellow-500/20 hover:border-yellow-500 transition-all hover:shadow-lg hover:shadow-yellow-500/20 bg-background/50 backdrop-blur">
                  <CardHeader>
                    <div className="h-12 w-12 rounded-lg bg-yellow-500/10 flex items-center justify-center mb-4">
                      <Award className="h-6 w-6 text-yellow-500" />
                    </div>
                    <CardTitle className="text-xl">Gamified Rewards</CardTitle>
                    <CardDescription className="text-base">
                      Prize pools, leaderboards, and reputation NFTs incentivize
                      excellence and engagement.
                    </CardDescription>
                  </CardHeader>
                </Card>
              </StaggerItem>
            </StaggerContainer>
          </div>
        </section>

        {/* How It Works - Requesters */}
        <section className="py-24 relative">
          <div className="container">
            <FadeIn className="mx-auto max-w-6xl">
              <div className="text-center mb-16">
                <h2 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4">
                  For AI Builders
                </h2>
                <p className="text-xl text-muted-foreground">
                  Create and manage labeling tasks in minutes
                </p>
              </div>

              <StaggerContainer className="grid gap-8 md:grid-cols-3 relative">
                <StaggerItem>
                  <div className="relative p-6 rounded-2xl border border-blue-500/20 bg-background/50 backdrop-blur hover:border-blue-500/50 transition-all group">
                    <div className="absolute -left-4 top-8 h-16 w-16 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-blue-500/50">
                      1
                    </div>
                    <div className="ml-8">
                      <h3 className="text-2xl font-bold mb-3">
                        Upload Dataset
                      </h3>
                      <p className="text-muted-foreground leading-relaxed">
                        Upload your data to decentralized Walrus storage and
                        define annotation requirements with our intuitive
                        interface.
                      </p>
                    </div>
                  </div>
                </StaggerItem>

                <StaggerItem>
                  <div className="relative p-6 rounded-2xl border border-purple-500/20 bg-background/50 backdrop-blur hover:border-purple-500/50 transition-all group">
                    <div className="absolute -left-4 top-8 h-16 w-16 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-purple-500/50">
                      2
                    </div>
                    <div className="ml-8">
                      <h3 className="text-2xl font-bold mb-3">Set Bounty</h3>
                      <p className="text-muted-foreground leading-relaxed">
                        Stake SUI tokens as bounty. Smart contracts ensure
                        automatic and fair distribution to quality labelers.
                      </p>
                    </div>
                  </div>
                </StaggerItem>

                <StaggerItem>
                  <div className="relative p-6 rounded-2xl border border-pink-500/20 bg-background/50 backdrop-blur hover:border-pink-500/50 transition-all group">
                    <div className="absolute -left-4 top-8 h-16 w-16 rounded-full bg-pink-500 flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-pink-500/50">
                      3
                    </div>
                    <div className="ml-8">
                      <h3 className="text-2xl font-bold mb-3">Get Labels</h3>
                      <p className="text-muted-foreground leading-relaxed">
                        Receive high-quality labeled data through consensus
                        validation from multiple expert labelers.
                      </p>
                    </div>
                  </div>
                </StaggerItem>
              </StaggerContainer>
            </FadeIn>
          </div>
        </section>

        {/* How It Works - Labelers */}
        <section className="py-24 bg-muted/30 relative">
          <div className="container">
            <FadeIn className="mx-auto max-w-6xl">
              <div className="text-center mb-16">
                <h2 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4">
                  For Data Labelers
                </h2>
                <p className="text-xl text-muted-foreground">
                  Earn rewards by providing quality annotations
                </p>
              </div>

              <StaggerContainer className="grid gap-8 md:grid-cols-3 relative">
                <StaggerItem>
                  <div className="relative p-6 rounded-2xl border border-green-500/20 bg-background/50 backdrop-blur hover:border-green-500/50 transition-all group">
                    <div className="absolute -left-4 top-8 h-16 w-16 rounded-full bg-green-500 flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-green-500/50">
                      1
                    </div>
                    <div className="ml-8">
                      <h3 className="text-2xl font-bold mb-3">Browse Tasks</h3>
                      <p className="text-muted-foreground leading-relaxed">
                        Discover available tasks filtered by type, reward, and
                        difficulty level that match your skills.
                      </p>
                    </div>
                  </div>
                </StaggerItem>

                <StaggerItem>
                  <div className="relative p-6 rounded-2xl border border-orange-500/20 bg-background/50 backdrop-blur hover:border-orange-500/50 transition-all group">
                    <div className="absolute -left-4 top-8 h-16 w-16 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-orange-500/50">
                      2
                    </div>
                    <div className="ml-8">
                      <h3 className="text-2xl font-bold mb-3">Annotate Data</h3>
                      <p className="text-muted-foreground leading-relaxed">
                        Use our intuitive tools to label images, text, or audio
                        data with precision and speed.
                      </p>
                    </div>
                  </div>
                </StaggerItem>

                <StaggerItem>
                  <div className="relative p-6 rounded-2xl border border-yellow-500/20 bg-background/50 backdrop-blur hover:border-yellow-500/50 transition-all group">
                    <div className="absolute -left-4 top-8 h-16 w-16 rounded-full bg-yellow-500 flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-yellow-500/50">
                      3
                    </div>
                    <div className="ml-8">
                      <h3 className="text-2xl font-bold mb-3">Earn Rewards</h3>
                      <p className="text-muted-foreground leading-relaxed">
                        Get paid instantly in SUI when your labels reach
                        consensus. Build reputation for bigger rewards.
                      </p>
                    </div>
                  </div>
                </StaggerItem>
              </StaggerContainer>
            </FadeIn>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 bg-muted/30 relative">
          <div className="container">
            <FadeIn className="mx-auto max-w-2xl text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
                Platform Statistics
              </h2>
              <p className="text-lg text-muted-foreground">
                Real-time data from the Sui blockchain
              </p>
            </FadeIn>

            <div className="grid md:grid-cols-4 gap-6 max-w-5xl mx-auto">
              <Card className="text-center">
                <CardHeader>
                  <div className="mx-auto h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center mb-3">
                    <Award className="h-6 w-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-3xl font-bold">
                    {tasksLoading ? "..." : totalTasks}
                  </CardTitle>
                  <CardDescription>Total Tasks</CardDescription>
                </CardHeader>
              </Card>

              <Card className="text-center">
                <CardHeader>
                  <div className="mx-auto h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center mb-3">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                  <CardTitle className="text-3xl font-bold">
                    {tasksLoading ? "..." : activeTasks}
                  </CardTitle>
                  <CardDescription>Active Tasks</CardDescription>
                </CardHeader>
              </Card>

              <Card className="text-center">
                <CardHeader>
                  <div className="mx-auto h-12 w-12 rounded-full bg-purple-500/10 flex items-center justify-center mb-3">
                    <Users className="h-6 w-6 text-purple-600" />
                  </div>
                  <CardTitle className="text-3xl font-bold">
                    {submissionsLoading ? "..." : totalSubmissions}
                  </CardTitle>
                  <CardDescription>Total Submissions</CardDescription>
                </CardHeader>
              </Card>

              <Card className="text-center">
                <CardHeader>
                  <div className="mx-auto h-12 w-12 rounded-full bg-yellow-500/10 flex items-center justify-center mb-3">
                    <Zap className="h-6 w-6 text-yellow-600" />
                  </div>
                  <CardTitle className="text-3xl font-bold">
                    {tasksLoading ? "..." : totalBountySUI}
                  </CardTitle>
                  <CardDescription>Total Bounty (SUI)</CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-linear-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10" />
          <div className="container relative z-10">
            <FadeIn>
              <Card className="border-2 border-blue-500/30 bg-background/80 backdrop-blur-xl shadow-2xl">
                <CardHeader className="text-center py-16 px-6">
                  <CardTitle className="text-4xl sm:text-5xl font-bold mb-6 bg-linear-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                    Ready to Get Started?
                  </CardTitle>
                  <CardDescription className="text-xl mb-8 max-w-2xl mx-auto">
                    Join the decentralized data labeling revolution. Fair pay,
                    transparent quality, instant rewards.
                  </CardDescription>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button
                      size="lg"
                      className="group bg-blue-600 hover:bg-blue-700 text-white h-12 px-8"
                    >
                      <Link href="/tasks" className="flex items-center">
                        Start Labeling
                        <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                      </Link>
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      className="border-purple-500/50 hover:bg-purple-500/10 h-12 px-8"
                    >
                      <Link href="/dashboard/create-task">
                        Create Your First Task
                      </Link>
                    </Button>
                  </div>
                </CardHeader>
              </Card>
            </FadeIn>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t py-12 bg-muted/30">
          <div className="container">
            <div className="grid gap-8 md:grid-cols-4">
              <div>
                <h3 className="font-bold mb-4">Songsim Label</h3>
                <p className="text-sm text-muted-foreground">
                  Decentralized data labeling marketplace on Sui blockchain
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Product</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>
                    <Link href="/tasks" className="hover:text-foreground">
                      Browse Tasks
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/dashboard/create-task"
                      className="hover:text-foreground"
                    >
                      Create Task
                    </Link>
                  </li>
                  <li>
                    <Link href="/leaderboard" className="hover:text-foreground">
                      Leaderboard
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Resources</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>
                    <Link href="/docs" className="hover:text-foreground">
                      Documentation
                    </Link>
                  </li>
                  <li>
                    <Link href="/docs/guide" className="hover:text-foreground">
                      User Guide
                    </Link>
                  </li>
                  <li>
                    <Link href="/docs/api" className="hover:text-foreground">
                      API
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Community</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>
                    <a
                      href="https://github.com"
                      className="hover:text-foreground"
                    >
                      GitHub
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://discord.com"
                      className="hover:text-foreground"
                    >
                      Discord
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://twitter.com"
                      className="hover:text-foreground"
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
