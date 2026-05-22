import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/sidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ContentDash - AI-Powered Content Management",
  description:
    "Manage your social media content, analytics, and engagement across platforms with AI-powered insights from OmniSocial.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
    >
      <body className="min-h-full bg-zinc-950 text-zinc-100">
        <div className="flex min-h-screen">
          {/* Sidebar — hidden on mobile, fixed 16rem on desktop */}
          <Sidebar />

          {/* Main content area offset by sidebar width on desktop */}
          <div className="flex flex-1 flex-col lg:pl-64">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
