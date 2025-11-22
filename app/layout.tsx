import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { ThemeProvider } from "@/components/theme-provider";
import { Navbar } from "@/components/navbar";
import { LoadingProvider } from "@/contexts/loading-context";
import GlobalLoader from "@/components/global-loader";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Songsim Label - Decentralized Data Labeling on Sui",
  description:
    "AI training data annotation marketplace on Sui blockchain. Fair, transparent, and community-driven.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <LoadingProvider>
            <Providers>
              <GlobalLoader />
              <main className="min-h-screen">{children}</main>
            </Providers>
          </LoadingProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
