import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { ThemeProvider } from "@/components/theme-provider";
import { Navbar } from "@/components/navbar";
import { LoadingProvider } from "@/contexts/loading-context";
import GlobalLoader from "@/components/global-loader";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Songsim Label - Decentralized Data Labeling on Sui",
  description:
    "AI training data annotation marketplace on Sui blockchain. Fair, transparent, and community-driven.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="overflow-x-hidden">
      <body className={`${inter.variable} font-sans antialiased overflow-x-hidden`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <LoadingProvider>
            <Providers>
              <GlobalLoader />
              <Toaster richColors position="top-right" />
              <main className="min-h-screen">{children}</main>
            </Providers>
          </LoadingProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
