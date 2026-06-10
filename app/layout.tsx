import type { Metadata } from "next";
import "./globals.css";
// Inter is loaded via @import in globals.css — no next/font/google needed

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
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
