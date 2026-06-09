import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  preload: false,        // skip Google Fonts network fetch during build
  fallback: ["system-ui", "Arial", "sans-serif"],
});

export const metadata: Metadata = {
  title: "IDForge AI — Create Professional ID Cards with AI",
  description:
    "Enterprise-grade AI-powered ID Card Generation Platform. Upload a sample, let AI recreate the design, generate bulk cards, and manage digital credentials.",
  keywords: "ID card generator, AI ID cards, bulk ID generation, QR verification, digital identity",
  authors: [{ name: "IDForge AI" }],
  openGraph: {
    title: "IDForge AI — Create Professional ID Cards with AI",
    description: "Create thousands of professional ID cards in minutes with AI.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} dark`} suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
