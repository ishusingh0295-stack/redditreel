import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ToastContext";
import SecurityInitializer from "@/components/SecurityInitializer";
import { Analytics } from "@vercel/analytics/next";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Reddit Reel AI — Discover Videos You'll Love",
  description:
    "AI-powered infinite scroll video feed from Reddit. Chat to search, discover, and watch the best video content curated just for you.",
  keywords: [
    "reddit",
    "videos",
    "reels",
    "AI search",
    "short videos",
    "infinite scroll",
  ],
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    shortcut: "/favicon.ico",
    apple: "/icon.svg",
  },
  manifest: "/manifest.json",
  applicationName: "Reddit Reel AI",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Reddit Reel AI",
  },
  openGraph: {
    title: "Reddit Reel AI",
    description: "AI-powered infinite scroll video feed from Reddit",
    type: "website",
    url: "https://reddit-reel-ai.vercel.app",
    siteName: "Reddit Reel AI",
  },
  twitter: {
    card: "summary_large_image",
    title: "Reddit Reel AI",
    description: "AI-powered infinite scroll video feed from Reddit",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} antialiased`}>
        <SecurityInitializer />
        <ToastProvider>{children}</ToastProvider>
        <Analytics />
      </body>
    </html>
  );
}
